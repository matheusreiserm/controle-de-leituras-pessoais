import { Book } from '../types';
import { getAccessToken, setAccessToken, loginWithGoogle } from './firebase';

const PARENT_FOLDER_NAME = 'Google AI Studio';
const BACKUPS_FOLDER_NAME = 'Backups';
const BACKUP_FILE_NAME = 'controle_leituras_backup.json';
const LEGACY_FILE_NAME = 'controle_leituras_acervo.json';

/**
 * Ensures an OAuth access token is available.
 * If interactive is true, prompts Google sign-in popup if token is missing.
 * If interactive is false, returns null if token is not already in memory/storage.
 */
async function ensureToken(interactive: boolean = true): Promise<string | null> {
  let token = getAccessToken();
  if (!token && interactive) {
    try {
      const res = await loginWithGoogle();
      token = res?.accessToken || null;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('A autorização com o Google foi cancelada antes de concluir.');
      }
      throw new Error(err?.message || 'Falha ao autenticar com a Conta Google.');
    }
  }
  return token;
}

async function getOrCreateFolder(
  token: string,
  folderName: string,
  parentId?: string
): Promise<string> {
  let queryStr = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    queryStr += ` and '${parentId}' in parents`;
  }
  const query = encodeURIComponent(queryStr);

  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    if (searchRes.status === 401) {
      setAccessToken(null);
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Erro ao buscar pasta '${folderName}' no Drive (${searchRes.status})`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if it doesn't exist
  const createBody: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    createBody.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    if (createRes.status === 401) {
      setAccessToken(null);
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Erro ao criar pasta '${folderName}' no Google Drive.`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Ensures 'Google AI Studio' folder and 'Google AI Studio/Backups' subfolder exist.
 * Returns the folder ID for 'Backups'.
 */
export async function ensureBackupsFolder(token: string): Promise<{ parentFolderId: string; backupsFolderId: string }> {
  const parentFolderId = await getOrCreateFolder(token, PARENT_FOLDER_NAME);
  const backupsFolderId = await getOrCreateFolder(token, BACKUPS_FOLDER_NAME, parentFolderId);
  return { parentFolderId, backupsFolderId };
}

/**
 * Export app state to 'Google AI Studio/Backups/controle_leituras_backup.json'.
 * Always replaces/overwrites the previous backup file if present.
 */
export async function exportToGoogleDrive(
  books: Book[],
  interactive: boolean = true
): Promise<{ success: boolean; message: string; fileId?: string }> {
  try {
    let token = await ensureToken(interactive);

    if (!token) {
      if (interactive) {
        return {
          success: false,
          message: 'Autenticação com a conta Google necessária para acessar o Google Drive.',
        };
      }
      // Non-interactive background sync: exit silently without error
      return {
        success: false,
        message: 'Sincronização em segundo plano aguardando autorização.',
      };
    }

    let backupsFolderId: string;
    try {
      const folderRes = await ensureBackupsFolder(token);
      backupsFolderId = folderRes.backupsFolderId;
    } catch (err: any) {
      if (err?.message === 'TOKEN_EXPIRED' && interactive) {
        const res = await loginWithGoogle();
        if (res?.accessToken) {
          token = res.accessToken;
          const folderRes = await ensureBackupsFolder(token);
          backupsFolderId = folderRes.backupsFolderId;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // Search for existing file in Backups folder
    const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and '${backupsFolderId}' in parents and trashed=false`);
    let searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchRes.ok && searchRes.status === 401 && interactive) {
      const res = await loginWithGoogle();
      if (res?.accessToken) {
        token = res.accessToken;
        searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    if (!searchRes.ok) {
      if (searchRes.status === 401) {
        setAccessToken(null);
      }
      throw new Error(`Erro ao buscar arquivo de backup no Drive (${searchRes.status})`);
    }

    const searchData = await searchRes.json();
    let fileId: string;

    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id;
    } else {
      // Create new backup file in Backups subfolder
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: BACKUP_FILE_NAME,
          parents: [backupsFolderId],
          mimeType: 'application/json',
        }),
      });

      if (!createRes.ok) {
        throw new Error(`Erro ao criar novo arquivo de backup na pasta 'Google AI Studio/Backups'.`);
      }

      const fileData = await createRes.json();
      fileId = fileData.id;
    }

    // Overwrite content
    const jsonContent = JSON.stringify(books, null, 2);
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!updateRes.ok) {
      throw new Error(`Falha ao atualizar o arquivo no Drive (${updateRes.status})`);
    }

    return {
      success: true,
      message: `Backup exportado com sucesso no Google Drive na pasta 'Google AI Studio/Backups' (${books.length} leituras)!`,
      fileId,
    };
  } catch (error: any) {
    if (interactive) {
      console.warn('Export error:', error);
    }
    return {
      success: false,
      message: error.message || 'Erro ao exportar backup para o Google Drive.',
    };
  }
}

/**
 * Import backup file from 'Google AI Studio/Backups/controle_leituras_backup.json'.
 */
export async function importFromGoogleDrive(
  interactive: boolean = true
): Promise<{ success: boolean; message: string; books?: Book[] }> {
  try {
    let token = await ensureToken(interactive);

    if (!token) {
      return {
        success: false,
        message: 'Autenticação com a conta Google necessária para importar do Google Drive.',
      };
    }

    let parentFolderId: string;
    let backupsFolderId: string;

    try {
      const folderRes = await ensureBackupsFolder(token);
      parentFolderId = folderRes.parentFolderId;
      backupsFolderId = folderRes.backupsFolderId;
    } catch (err: any) {
      if (err?.message === 'TOKEN_EXPIRED' && interactive) {
        const res = await loginWithGoogle();
        if (res?.accessToken) {
          token = res.accessToken;
          const folderRes = await ensureBackupsFolder(token);
          parentFolderId = folderRes.parentFolderId;
          backupsFolderId = folderRes.backupsFolderId;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // 1. Search in Google AI Studio/Backups for BACKUP_FILE_NAME
    let query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and '${backupsFolderId}' in parents and trashed=false`);
    let searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchRes.ok && searchRes.status === 401 && interactive) {
      const res = await loginWithGoogle();
      if (res?.accessToken) {
        token = res.accessToken;
        searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    let searchData = searchRes.ok ? await searchRes.json() : { files: [] };
    let fileId: string | null = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

    // 2. Fallback: Search in Google AI Studio/Backups for any json file
    if (!fileId) {
      const fallbackQuery = encodeURIComponent(`'${backupsFolderId}' in parents and mimeType='application/json' and trashed=false`);
      const fbRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${fallbackQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData.files && fbData.files.length > 0) {
          fileId = fbData.files[0].id;
        }
      }
    }

    // 3. Fallback: Search in parent 'Google AI Studio' folder for LEGACY_FILE_NAME
    if (!fileId && parentFolderId) {
      const legacyQuery = encodeURIComponent(`name='${LEGACY_FILE_NAME}' and '${parentFolderId}' in parents and trashed=false`);
      const legRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${legacyQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (legRes.ok) {
        const legData = await legRes.json();
        if (legData.files && legData.files.length > 0) {
          fileId = legData.files[0].id;
        }
      }
    }

    if (!fileId) {
      return {
        success: false,
        message: "Nenhum arquivo de backup foi encontrado na pasta 'Google AI Studio/Backups' no seu Google Drive.",
      };
    }

    // Fetch file content
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!downloadRes.ok) {
      if (downloadRes.status === 401) {
        setAccessToken(null);
      }
      throw new Error(`Não foi possível baixar o arquivo de backup do Drive (${downloadRes.status})`);
    }

    const jsonText = await downloadRes.text();
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      throw new Error('O arquivo de backup no Drive não contém um formato JSON válido.');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Estrutura de dados do backup inválida (esperava-se uma lista de livros).');
    }

    return {
      success: true,
      message: `Backup restaurado com sucesso do Google Drive! (${parsed.length} leituras carregadas)`,
      books: parsed as Book[],
    };
  } catch (error: any) {
    if (interactive) {
      console.warn('Import error:', error);
    }
    return {
      success: false,
      message: error.message || 'Erro ao importar backup do Google Drive.',
    };
  }
}
