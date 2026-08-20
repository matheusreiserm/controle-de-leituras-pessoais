const fs = require('fs');

const rawCsv = `Autor;Livro;Formato
Kurt Vonnegut;Matadouro N 5;Livro Fsico
Richard Brautigan;In Watermellon Sugar;Livro Fsico
Rikki Ducornet;Gazelle;Livro Fsico
Muriel Spark;Realidade e Sonhos;Livro Fsico
Amos Tutuola;O Bebedor de Vinho de Palmeira;Livro Fsico
Richard Matheson;I am Legend;Livro Fsico
Harry Mathews;The Solitary Twin;Livro Fsico
Muriel Spark;O Banquete;Livro Fsico
Srgio Sant'Anna;Amazona;Livro Fsico
B.S. Johnson;Christie Malry's Own Double Entry;Livro Fsico
Imre Kertsz;Histria Policial;Livro Fsico
Jennifer Egan;O Torreo;Livro Fsico
Leonardo Sciascia;A Cada um o Seu;Livro Fsico
Nathanael West;Um Milho de Dlares;Livro Fsico
Sndor Mrai;O Legado de Eszter;Livro Fsico
Ismail Kadar;A Filha de Agamenon;Livro Fsico
Ismail Kadar;O Sucessor;Livro Fsico
Loureno Mutarelli;O Filho Mais Velho de Deus e/ou Livro IV;Livro Fsico
Maurice Dantec;Razes do Mal;Livro Fsico
B.S. Johnson;Albert Angelo;Livro Fsico
Muriel Spark;Uma Escola para a Vida;Livro Fsico
Marcelo Mirisola;A Vida No tem Cura;Livro Fsico
Marcelo Mirisola;Como se me Fumasse;Livro Fsico
Marcelo Mirisola;Quanto Custa um Elefante?;Livro Fsico
Frdric Beigbeder;Windows on the World;Livro Fsico
Bernardo Carvalho;O ltimo Gozo do Mundo;Livro Fsico
Peter Straub;The Hellfire Club;Livro Fsico
Akira Yoshimura;Naufrgios;Livro Fsico
Antonio Xerxenesky;As Perguntas;Livro Fsico
Michel Houellebecq;Aniquilar;Livro Fsico
Jamil Snege;Viver  Prejudicial  Sade;Livro Fsico
Bae Su-ah;Noite e Dia Desconhecidos;Livro Fsico
Unica Zrn;Dark Spring;Livro Fsico
Tove Ditlevsen;The Faces;Livro Fsico
Clara Drummond;Os Coadjuvantes;Livro Fsico
Ann Quin;Berg;Livro Fsico
Nina Berberova;O Lacaio e a Meretriz;Livro Fsico
Hiroko Oyamada;The Hole;Livro Fsico
Hiroko Oyamada;The Factory;Livro Fsico
Julin Fuks;A Resistncia;Livro Fsico
Gen'ichiro Takahashi;Sayonara, Gangsters;Livro Fsico
Louis Armand;Breakfast at Midnight;Kindle
Yukiko Motoya;The Lonesome Bodybuilder;Livro Fsico
Dag Solstad;Romance 11, Livro 18;Livro Fsico
Cormac McCarthy;No Country for Old Men;Livro Fsico
Yukio Mishima;Vida  Venda;Livro Fsico
Mario Levrero;Nick Carter;Livro Fsico
Pedro Juan Gutirrez;Nosso GG em Havana;Livro Fsico
Muriel Spark;Memento Mori;Livro Fsico
Lela Slimani;Cano de Ninar;Livro Fsico
Richard Brautigan;Sombrero Fallout;Archive.com
Pierre Lous;Esse Obscuro Objeto do Desejo;Livro Fsico
Lars Gustafsson;A Tiler's Afternoon;Livro Fsico
Richard Brautigan;Pescar Truta na Amrica;Livro Fsico
Ahmed Saadawi;Frankenstein in Baghdad;Livro Fsico
Milan Kundera;A Festa da Insignificncia;Livro Fsico
Georges Rodenbach;Bruges-la-Morte;Livro Fsico
Richard Laymon;To Wake The Dead;Kindle
Richard Laymon;The Woods are Dark;Kindle
Stephen King;If it Bleeds;Livro Fsico
Heinrich Bll;Fim de uma Viagem;Livro Fsico
Thomas Bernhard;Mestres Antigos;Livro Fsico
Nikolai Leskov;Lady Macbeth do Distrito de Mtsensk;Livro Fsico
Iuri Olicha;Inveja;Livro Fsico
Pter Ndas;A Bblia;Livro Fsico
Jon Fosse;Brancura;Livro Fsico
Csar Aira;Pinceladas Musicais;Livro Fsico
Haruki Murakami;Killing Commendatore;Livro Fsico
Bentley Little;The Disappearance;Livro Fsico
Barbara Comyns;Who Was Changed and Who Was Dead;Livro Fsico
Daniel Galera;Barba Ensopada de Sangue;Livro Fsico
Sven Holm;Termush;Livro Fsico
Fleur Jaeggy;Sweet Days of Discipline;Livro Fsico
Michel Houellebecq;Extenso do Domnio da Luta;Livro Fsico
Fleur Jaeggy;Last Vanities;Livro Fsico
Graham Greene;Dr. Fischer de Genebra;Livro Fsico
Hiromi Kawakami;A Valise do Professor;Livro Fsico
Nathanael West;Miss Coraes Solitrios;Livro Fsico
Alasdair Gray;Poor Things;Archive.com
Denis Johnson;Ningum se Mexe;Livro Fsico
Natsuko Imamura;The Woman in the Purple Skirt;Livro Fsico
Yukio Mishima;Star;Livro Fsico
Shusaku Endo;When I Whistle;Archive.com
Elvira Vigna;s Seis em Ponto;Livro Fsico
Dezs? Kosztolnyi;Skylark;Livro Fsico
Gustavo Bernardo;O Gosto do Apfelstrudel;Livro Fsico
Julin Fuks;A Ocupao;Livro Fsico
Dambudzo Marechera;The House of Hunger;Archive.com
Vladimir Sorokin;Telluria;Livro Fsico
Peter Handke;Don Juan (Narrado por Ele Mesmo);Livro Fsico
Percival Everett;Erasure;Archive.com
Vladimir Sorokin;Day Of The Oprichnik;Livro Fsico
Lars Gustafsson;Sigismundo;Livro Fsico
Victor Pelevin;The Yellow Arrow;Livro Fsico
T?son Shimazaki;The Broken Commandment;Archive.com
Gaito Gazdanov;The Spectre of Alexander Wolf;Livro Fsico
Jon Fosse;A Casa de Barcos;Livro Fsico
Vladimir Sorokin;The Queue;Archive.com
Victor Pelevin;Omon Ra;Livro Fsico
Jon Fosse; a Ales;Livro Fsico
Vladmir Zazbrin;Lasca;Livro Fsico
Viktor Shklovsky;Zoo or Letters Not About Love;Livro Fsico
Vernica Stigger;Sul;Livro Fsico
Vernica Stigger;Minha Novela;Livro Fsico
Sasha Sokolov;A School for Fools;Archive.com
Alexander Lernet-Holenia;Mona Lisa;Archive.com
Enrique Vila-Matas;Mac e o seu Contratempo;Livro Fsico
Annie Ernaux;O Jovem;Livro Fsico
Annie Ernaux;O Acontecimento;Livro Fsico
Venedikt Erofeev;Moscow to the End of the Line;Archive.com
Victor Pelevin;The Helmet of Horror;Livro Fsico
Evelio Rosero;Seor que no Conoce la Luna;Archive.com
Sigismund Krzyzanowski;O Marcador de Pgina;Livro Fsico
Jon Fosse;Morning and Evening;Livro Fsico
Ldia Chukovskaia;Sofia Petrovna;Archive.com
Yann Andra;M. D.;Livro Fsico
Ilya Ehrenburg;As Aventuras de Julio Jurenito;Livro Fsico
Katai Tayama;The Quilt;Archive.com
Csar Aira;La Vida Nueva;Livro Fsico
Mario Levrero;La Ciudad;Livro Fsico
Marcelo Labes;Trs Porcos;Livro Fsico
Mario Bellatin;La Jornada de la Mona y el Paciente;PDF
Richard Laymon;Endless Night;Archive.com
Mario Bellatin;Retrato de Mussolini Con Familia;Livro Fsico
Alberto Laiseca;Camilo Aldao [Hybris];Livro Fsico
Vernica Stigger;Os Anes;Livro Fsico
Mario Bellatin;El Gran Vidrio;PDF
Csar Aira;El Juego de los Mundos;Livro Fsico
Harry Mathews;My Life in CIA: A Chronicle of 1973;Archive.com
Serguei Dovltov;O Ofcio;Livro Fsico
Mario Bellatin;Ces Heris;PDF
Mario Bellatin;Flores;PDF
Csar Aira;Como Me Re;PDF
Sylvia Molloy;Varia Imaginacin;Archive.com
douard Lev;Autoportrait;Livro Fsico
Csar Aira;Cumpleaos;Livro Fsico
Vernica Stigger;Gran Cabaret Demenzial;Livro Fsico
Vernica Stigger;O Trgico e Outras Comdias;Livro Fsico
M. Ageyev;Novel with Cocaine;Archive.com
Csar Aira;O Congresso de Literatura;Livro Fsico
Amit Chaudhuri;Friend of my Youth;Archive.com
Mario Bellatin;Underwood Porttil Modelo 1915;PDF
Csar Aira;Artforum;Livro Fsico
Mario Bellatin;El Pasante de Notario Murasaki Shikibu;PDF
Mario Bellatin;Shiki Nagaoka: Una Nariz de Ficcin;PDF
Hctor Libertella;El rbol de Saussure;PDF
Hctor Libertella;Zettel;PDF
Csar Aira;Biografa;Livro Fsico
Lev Tolsti;A Morte de Ivan Ilitch;Audible
Horacio Castellanos Moya;El Arma en el Hombre;Livro Fsico
Natalia Timerman;Copo Vazio;Audible
Csar Aira;Em Havana;Livro Fsico
Andrei Platonov;The Foundation Pit;PDF
Hye-young Pyun;The Hole;Livro Fsico
Csar Aira;A Prova;Livro Fsico
Fogwill;Muchacha Punk;PDF
Margo Glantz;Las Genealogas;Archive.com
Mario Bellatin;Los Fantasmas del Masajista;PDF
Emmanuel Carrre;Um Romance Russo;Livro Fsico
Miguel de Unamuno;Niebla;Archive.com
Joca Reiners Terron;A Morte e o Meteoro;Audible
Philip Roth;A Humilhao;Livro Fsico
Csar Aira;Nouvelles Impressions du Petit Maroc;Kindle
Clive Barker;The Damnation Game;Livro Fsico
Richard Laymon;Flesh;Audible
Richard Laymon;Dark Mountain;Audible
Elfriede Jelinek;The Piano Teacher;Livro Fsico
Jon Fosse;Septology I-II - The Other Name;Fsico/Audible
Mario de Andrade;Macunama;Livro Fsico
Thomas Bernhard;Sim;Livro Fsico
Csar Aira;Diario de la Hepatitis;PDF
Csar Aira;Triano;PDF
Hctor Libertella;Caverncolas!;Livro Fsico
Cormac McCarthy;The Road;Fsico/Audible
Fidor Dostoivski;Um Jogador;Livro Fsico
Leonid Tsypkin;Summer in Baden-Baden;Archive.com
Vladimir Nabokov;O Mago;Livro Fsico
U. R. Ananthamurthy;Samskara;Archive.com
Wolfgang Hilbig;Old Rendering Plant;Livro Fsico
J.G. Ballard;High Rise;Livro Fsico
Ayi Kwei Armah;The Beautyful Ones Are Not Yet Born;Archive.com
Amit Chaudhuri;Afternoon Raag;Livro Fsico
Amos Tutuola;My Life in the Bush of Ghosts;Archive.com
Amos Tutuola;O Bebedor de Vinho de Palmeira;Livro Fsico
Bessie Head;A Question of Power;Archive.com
Loureno Mutarelli;Jesus Kid;Livro Fsico
Eliane Marques;Louas de Famlia;PDF
Rachid al-Daif;Learning English;Archive.com
Kathy Acker;Kathy Goes to Haiti;Archive.com
Rachid al-Daif;Passage to Dusk;Archive.com
Ronald Sukenick;Up;PDF
Nona Fernndez;Chilean Electric;Archive.com
Kenzaburo Oe;Uma Questo Pessoal;Livro Fsico
Kathy Acker;Childlike Life of the Black Tarantula;Archive.com
Juan Francisco Manzano;A Autobiografia do Poeta-Escravo;PDF
Nona Fernndez;Space Invaders;Livro Fsico
Lima Barreto;Dirio do Hospcio;Livro Fsico
Lima Barreto;O Cemitrio dos Vivos;Livro Fsico
Loureno Mutarelli;Eu Te Amo Lucimar;PDF
Loureno Mutarelli;A Caixa de Areia;Livro Fsico
Constance Debr;Playboy;Livro Fsico
Vernica Stigger;Krakatoa;Livro Fsico
Eduard Limonov;It's Me, Eddie;PDF
Ry? Murakami;Almost Transparent Blue;Livro Fsico
Luciano de Samsata;Uma Histria Verdica;PDF
Cristovo Tezza;O Filho Eterno;Livro Fsico
Csar Aira;Moreira;PDF
Camila Sosa Villada;O Parque das Irms Magnficas;Livro Fsico
Ania Ahlborn;The Neighbors;Audible
Adam Nevill;The Vessel;Audible
Kathy Acker;I Dreamt I Was a Nymphomaniac: Imagining;Archive.com
Richard Laymon;In the Dark;Archive.com
Csar Aira;Continuao de Ideias Diversas;Livro Fsico
Csar Aira;El Tilo;PDF
Kathy Acker;Rip-Off Red, Girl Detective;Livro Fsico
Han Kang;Atos Humanos;Livro Fsico
Han Kang;O Livro Branco;Livro Fsico
Solvej Balle;Sobre o Clculo do Volume: 1;Livro Fsico
Marcelo Mirisola;Joana a Contragosto;Archive.com
Marcelo Mirisola;Animais em Extino;Archive.com
Muriel Spark;The Driver's Seat;Audible
Lars Gustafsson;The Tennis Players;Archive.com
Dag Solstad;Professor Andersen's Night;Archive.com
Richard Laymon;After Midnight;Archive.com
Oswaldo de Camargo;A Descoberta do Frio;Livro Fsico
Kathy Acker;Burning Bombing of America;Livro Fsico
Csar Aira;Los Misterios de Rosario;Archive.com
Mario Levrero;El Discurso Vaco;Archive.com
Mark Leyner;Et Tu, Babe;Livro Fsico
Michel Laub;Dirio da Queda;Livro Fsico
Vladimir Voinovitch;The Ivankiad;Archive.com
Jos Falero;Os Supridores;PDF
Csar Aira;La Serpiente;Livro Fsico
Plutarco;Vidas Paralelas - Teseu e Rmulo;PDF
Loureno Mutarelli;O Astronauta;PDF
Anderson Flix;Matei Minha Me;PDF
Washington Cucurto;Coisa de Negros;PDF
Washington Cucurto;Noites Vazias;PDF
Csar Aira;Como me Tornei Freira;Livro Fsico
Csar Aira;A Costureira e o Vento;Livro Fsico
Ricardo Lsias;O Cu dos Suicidas;Archive.com
Tatiana Salem Levy;Vista Chinesa;Audible
Richard Laymon;Dreadful Tales;Archive.com
Victor Pelevin;The Hall of the Singing Caryatids;Archive.com
Paulo Scott;Habitante Irreal;Livro Fsico
Sigizmund Krzhizhanovsky;Seven Stories;Archive.com
Cees Nooteboom;Rituais;Livro Fsico
Vladimir Sorokin;The Blizzard;Livro Fsico
Loureno Mutarelli;Sequelas;Livro Fsico
Samuel Rawet;Viagens De Ahasverus;Livro Fsico
Csar Aira;En la Confitera del Gas;Kindle
Mario Levrero;El Alma de Gardel;Fsico/Audible
Georges Bataille;O Azul do Cu;Livro Fsico
Emmanuel Carrre;Ioga;Livro Fsico
Stefan Zweig;Confusion;Archive.com
Andr Sant'Anna;Amor;PDF
Lszl Krasznahorkai;The Last Wolf;Archive.com
Jon Fosse;Trilogia;Livro Fsico
Kurt Tucholsky;Castle Gripsholm;Archive.com
Csar Aira;Un Sueo Realizado;Livro Fsico
Mario Bellatin;La Escuela del Dolor Humano de Sechun;Livro Fsico
Csar Aira;Las Curas Milagrosas del Doctor Aira;Livro Fsico
Blaise Cendrars;Moravagine;Archive.com
Lszl Krasznahorkai;Herman;Archive.com
Bernardo Carvalho;Nove Noites;Livro Fsico
Kay Dick;They;Livro Fsico
Vernica Stigger;O Livro dos Sonhos;Livro Fsico
Csar Aira;En El Pensamiento;Livro Fsico
Fleur Jaeggy;Proleterka;Livro Fsico
Richard Laymon;Body Rides;Archive.com
Marcelo Mirisola;O Heri Devolvido;Livro Fsico
Vanessa Barbara;Operao Impensvel;Livro Fsico
Nawal el-Saadawi;God Dies by the Nile;Archive.com
Ren Descartes;Discurso do Mtodo;PDF
Csar Aira;Los Fantasmas;Livro Fsico
Marcelo Mirisola;Hosana na Sarjeta;PDF
Kenzaburo Oe;Seventeen;Archive.com
Kenzaburo Oe;J;Archive.com
Kathy Acker;The Adult Life of Toulouse Lautrec;Archive.com
Richard Powers;Galatea 2.2;Fsico/Audible
Gert Hofmann;The Spectacle at the Tower;Archive.com
Solvej Balle;Sobre o Clculo do Volume: 2;Livro Fsico
Mario Bellatin;Biografa Ilustrada de Mishima;PDF
Adolfo B Casares & Silvina Ocampo;Los que Aman, Odian;Archive.com
Mario Bellatin;Efecto Invernadero;PDF
Viktor Chklovsky;Third Factory;Archive.com
Lady Sarashina;The Sarashina Diary;PDF
Vladimir Sorokin;Red Pyramid;Livro Fsico
Marcelo Mirisola;O Azul do Filho Morto;Livro Fsico
Mario Bellatin;El Hombre Dinero;Livro Fsico
Marcelo Mirisola;Bangal;Livro Fsico
Marcelo Mirisola;Charque;Livro Fsico
Marcelo Mirisola;Notas da Arrebentao;Livro Fsico
Ricardo Lsias;Duas Praas;Livro Fsico
Ricardo Lsias;A Vista Particular;Livro Fsico
Izumi Suzuki;Set My Heart on Fire;Livro Fsico
Naoya Shiga;Reconciliation;Livro Fsico
Yuko Tsushima;Of Dogs and Walls;Livro Fsico
Barry Hannah;Ray;Livro Fsico
Mario Bellatin;Jacobo El Mutante;Livro Fsico
Richard Brautigan;The Abortion;Archive.com
Hitomi Kanehara;Autofiction;Archive.com
Murasaki Shikibu;The Diary of Lady Murasaki;Archive.com
Izumi Shikibu;Diaries of Court Ladies of Old Japan;Archive.com
Marcelo Mirisola;Ftima Fez os Ps para Mostrar na Choperia;Livro Fsico
Loureno Mutarelli;O Grifo de Abdera;Livro Fsico
Marcelo Mirisola;Memrias da Sauna Finlandesa;Livro Fsico
Pablo Prez;El Mendigo Chupapijas;PDF
Mario Levrero;Fauna / Desplazamientos;Archive.com
Csar Aira;Los Dos Payasos;Archive.com
Csar Aira;El Pequeo Monje Budista;Livro Fsico
Natrcia Pontes;Copacabana Dreams;Livro Fsico
Sergio Pitol;El Arte de la Fuga;Livro Fsico
Csar Aira;El Volante;Archive.com
Chico Buarque;Leite Derramado;Archive.com
Csar Aira;El Gran Misterio;Livro Fsico
Mario Bellatin;Carta Sobre os Cegos Para Uso dos que Veem;Livro Fsico
Mario Levrero;El Portero y el Otro;Archive.com
Michel Houellebecq;O Mapa e o Territrio;Livro Fsico
Ricardo Lsias;Anna O. E Outras Novelas;Livro Fsico
Jean-Jacques Rousseau;Confisses;PDF
Grard de Nerval;Aurlia, ou o Sonho e a Vida;PDF
Csar Aira;La Invencin del Tren Fantasma;Livro Fsico
Dante Alighieri;Inferno;Livro Fsico
Cyrano de Bergerac;Viagem  Lua;Livro Fsico
Ernesto Sabato;O Tnel;Livro Fsico
Jamil Snege;Como Tornar-se Invisvel em Curitiba;Archive.com
Csar Aira;Pinceladas Musicales;Archive.com
Csar Aira;Trs Lendas Pringlenses;Livro Fsico
Marcelo Mirisola;A F que Perdi nos Ces;Livro Fsico
Washington Cucurto;Las Aventuras del Sr. Maz;Archive.com
Dalia Rosetti;Dame Pelota;Archive.com
Daniel Guebel;Mis Escritores Muertos;PDF
Patricio Pron;O Esprito dos Meus Pais Continua a Subir...;Livro Fsico
Mauro Libertella;Mi Libro Enterrado;PDF
Serguei Dovltov;Parque Cultural;Livro Fsico
Damin Ros;Entrerrianos;Livro Fsico
Thomas de Quincey;Confessions of an English Opium-Eater;Archive.com
Fernando Noy;Sofoco;Archive.com
Lima Barreto;Dirio ntimo;PDF
Kathy Acker;Blood and Guts in High School;Livro Fsico
Marqus de Sade;Os Infortnios da Virtude;Livro Fsico
Joo Gilberto Noll;Lorde;Livro Fsico
Tiago Ferro;O Pai da Menina Morta;Livro Fsico
J.P. Cuenca;Descobri que Estava Morto;Livro Fsico
J.P. Cuenca;O Dia Mastroianni;Livro Fsico
Csar Aira;Prins;Livro Fsico
Jacques Fux;Antiterapias;Livro Fsico
Lev Tolsti;A Sonata a Kreutzer;Livro Fsico
Csar Aira;Fulgentius;Livro Fsico
Csar Aira;El Jardinero, el Escultor y el Fugitivo;Livro Fsico
Gert Jonke;The System of Vienna;Archive.com
Csar Aira;Entre los Indios;PDF
Lars Gustafsson;The Death of a Beekeeper;Archive.com
Rosemary Tonks;The Bloater;Livro Fsico
Gonalo M. Tavares;Short Movies;Livro Fsico
William T. Vollmann;Whores for Gloria;Livro Fsico
Csar Aira;Los Hombrecitos con Sobretodo;Livro Fsico
Marcelo Mirisola;Espeto Corrido;Livro Fsico
Ricardo Lsias;Divrcio;Livro Fsico
Rachid al-Daif;Dear Mr. Kawabata;Archive.com
Camila Sosa Villada;A Namorada de Sandro;Livro Fsico
Mikhail Bulgakov;Diaboliad;Archive.com
Mariana Eva Perez;Diario de una Princesa Montonera, 110% Verdad;PDF
Serguei Dovltov;The Zone;Archive.com
Bernardo Kucinski;K - Relato de uma Busca;Livro Fsico
Ivan Turguniev;Smoke;Archive.com
Naty Menstrual;Chuva Dourada Sobre Mim;Livro Fsico
Amara Moira;E Se Eu Fosse Puta;Livro Fsico
Jamil Snege;O Jardim, a Tempestade;Livro Fsico
Richard Laymon;Darkness, Tell Us;Archive.com
Csar Aira;La Fuente;Archive.com
Mario Bellatin;Damas Chinas;Archive.com
Mario Bellatin;El Jardn de la Seora Murakami;Archive.com
Csar Aira;El Pelcano;Livro Fsico
Csar Aira;Yo Era Una Mujer Casada;Livro Fsico
Emmanuel Bove;Meus Amigos;Livro Fsico
Kobo Abe;The Woman in the Dunes;Archive.com
Sayaka Murata;Querida Konbini;Livro Fsico
Brigid Brophy;Flesh;Archive.com
douard Louis;Lutas e Metamorfoses de uma Mulher;Livro Fsico
Katie Kitamura;A Separation;Archive.com
douard Louis;Quem Matou Meu Pai;Livro Fsico
Ludmilla Petrushevskaya;The Time: Night;Archive.com
Csar Aira;Yo Era Una Nia de Siete Aos;Livro Fsico
Marguerite Duras;O Amante;Livro Fsico
Hiroko Oyamada;Weasels in the Attic;Livro Fsico
Lima Barreto;Vida e Morte de M. J. Gonzaga de S;Archive.com
Emi Yagi;Diary of a Void;Archive.com
Atiq Rahimi;As Mil Casas do Sonho e do Terror;Livro Fsico
Pierre Loti;The Marriage of Loti;PDF
Mikhail Bulgakov;The Heart of a Dog;Livro Fsico
Osamu Dazai;The Flowers of Buffoonery;Livro Fsico
Pierre Loti;Madame Chrysanthemum;Archive.com
Cees Nooteboom;Mokusei!;PDF
Sndor Mrai;As Brasas;Livro Fsico
Iri Tyninov;O Tenente Quetange;Livro Fsico
Csar Aira;Dirio da Hepatite;Livro Fsico
Jun'ichir? Tanizaki;The Key;Archive.com
Flix Bruzzone;Los Topos;Archive.com
Alexander Lernet-Holenia;Baron Bagge;Archive.com
Pablo Katchadjian;O Que Fazer;Livro Fsico
Cees Nooteboom;In the Dutch Mountains;Livro Fsico
Constance Debr;Love Me Tender;Archive.com
Valeria Luiselli;Rostos na Multido;Livro Fsico
Robert Coover;Spanking the Maid;Archive.com
Tatiana Salem Levy;A Chave de Casa;Livro Fsico
Harry Laus;Monlogo De Uma Cachorra Sem Preconceitos;PDF
Uketsu;Casas Estranhas;Livro Fsico
Thomas Harris;Red Dragon;Archive.com
Ry? Murakami;Audition;Fsico/Audible
Laura Alcoba;La Casa de los Conejos;Archive.com
Bret Easton Ellis;The Shards;Fsico/Audible
Jon Fosse;I Is Another: Septology III-V;Fsico/Audible
Jon Fosse;A New Name: Septology VI-VII;Fsico/Audible
Thomas Pynchon;The Crying of Lot 49;Livro Fsico
Thomas Harris;The Silence of the Lambs;Archive.com
Mikhail Saltykov-Shchedrin;Foolsburg: The History of a Town;Livro Fsico
Sigizmund Krzhizhanovsky;The Return of Munchausen;Livro Fsico
Franoise Sagan;Bom Dia, Tristeza;Livro Fsico
Jos Emilio Pacheco;Las Batallas en el Desierto;Fsico/Audible
Alejandro Zambra;Bonsi;Fsico/Audible
Lszl Krasznahorkai;Animalinside;Archive.com
Lszl Krasznahorkai;Stntang;Livro Fsico
Mario Bellatin;Diwan;Livro Fsico
Max Frisch;Homo Faber;Fsico/Audible
Didier Eribon;Retorno a Reims;Livro Fsico
I Acevedo;Bate um Corao;Livro Fsico
Konstantin Vaginov;Goat Song;Livro Fsico
Philip K. Dick;Lies, Inc.;Fsico/Audible
Ricardo Piglia;Respirao Artificial;Livro Fsico
Ivan Turguniev;Clara Militch;Livro Fsico
Franois-Ren de Chateaubriand;Memoirs from Beyond the Grave: 1768-1800;Livro Fsico
Bentley Little;The Haunted;Fsico/Audible
Ivan Bnin;O Processo do Tenente Ielguin;Livro Fsico
Thomas Harris;Hannibal;Archive.com
Blake Crouch;Dark Matter;Archive.com
Robert Louis Stevenson;O Mdico e o Monstro;Livro Fsico
Vladimir Sorokin;Day of the Oprichnik;Archive.com
Horace Walpole;The Castle of Otranto;Fsico/Audible
Rin Usami;Idol, Burning;Fsico/Audible
J Soares;As Esganadas;Livro Fsico
Lyudmila Ulitskaya;The Funeral Party;Archive.com
Daniil Kharms;Crnicas da Razo Louca;Livro Fsico
Csar Aira;Dante e Reina;Livro Fsico
K?ji Suzuki;Ring;Livro Fsico
K?ji Suzuki;Spiral;Livro Fsico
K?ji Suzuki;Loop;Livro Fsico
Vladislav Khodassivitch;Necrpole;Livro Fsico
Ana Kiffer;No Muro da Nossa Casa;Livro Fsico
Ivan Turguniev;Primeiro Amor;Livro Fsico
Anton Tchkhov;O Duelo;Livro Fsico
Vladimir Sorokin;The Sugar Kremlin;Livro Fsico
K?ji Suzuki;Birthday;Archive.com
Yasunari Kawabata;O Lago;Livro Fsico
Jun'ichir? Tanizaki;H Quem Prefira Urtigas;Livro Fsico
Freida McFadden;The Gift;Archive.com
Bret Easton Ellis;Lunar Park;Fsico/Audible
Jun'ichir? Tanizaki;Dirio de um Velho Louco;Livro Fsico
Fidor Dostoivski;Noites Brancas;Audible
Jon Fosse;Melancholy I-II;Livro Fsico
Philip Roth;The Breast;Archive.com
Dyonlio Machado;Os Ratos;Kindle
Daniel Guebel;Derrumbe;PDF
Mario Levrero;Diario de un Canalla;Livro Fsico
Mario Levrero;Burdeos, 1972;Livro Fsico
Sophie Calle;Histrias Reais;Livro Fsico
Thomas Pynchon;Inherent Vice;Archive.com
Vladimir Nabokov;Lolita;Archive.com
Denis Johnson;Sonhos de Trem;Livro Fsico
Daniel Guebel;Las Mujeres que Am;Archive.com
Ivan Turguniev;O Rei Lear da Estepe;Livro Fsico
Washington Cucurto;Noites Vazias;Livro Fsico
Richard Laymon;Alarums;Archive.com
Miguel de Unamuno;San Miguel Bueno, Mrtir;Archive.com
Miguel de Unamuno;Cmo se Hace Una Novela;Archive.com
Steve Alten;Meg;Archive.com
Fabin Casas;Ocio;Archive.com
Edward Lee;The Bighead;Archive.com
Mariana Enriquez;ste es el Mar;Livro Fsico
Adam Nevill;The Ritual;Archive.com
Washington Cucurto;Coisa de Negros;Livro Fsico
Douglas Preston & Lincoln Child;The Relic;Archive.com
Mariana Enriquez;Nuestra Parte de Noche;Livro Fsico
Csar Aira;El Bautismo;Archive.com
Akiyuki Nozaka;The Pornographers;Archive.com
Junnosuke Yoshiyuki;The Dark Room;Archive.com
Caroline Blackwood;The Stepdaughter;Archive.com
Shirley Jackson;The Sundial;Archive.com
Thomas Harris;Hannibal Rising;Archive.com
Alan Burns;The Day Daddy Died;Archive.com
Eduard Limonov;His Butler's Story;PDF
Joo Gilberto Noll;Canoas e Marolas;Archive.com
Emily Bront;O Morro dos Ventos Uivantes;Livro Fsico
Jamil Snege;Viver  Prejudicial  Sade;Archive.com
Manuel Puig;El Beso de la Mujer Araa;Archive.com
Juan Pablo Villalobos;Fiesta en la Madriguera;Archive.com
Juan Villoro;Arrecife;Livro Fsico
Jos Almino;O Motor da Luz;Archive.com
Salvador Elizondo;Autobiografa;PDF
Lydia Zinovieva-Annibal;The Tragic Menagerie;Archive.com
Sergio Bizzio;Raiva;Livro Fsico
Margarita Karapanou;Kassandra and the Wolf;Livro Fsico
Freida McFadden;The Housemaid;Archive.com
Freida McFadden;The Housemaid's Secret;Archive.com
Georges Arnaud;The Wages of Fear;Archive.com
K?ji Suzuki;S;Livro Fsico
Jim Dodge;Fup;Archive.com
Mikhail Bulgakov;The Fatal Eggs;Livro Fsico
Margarita Karapanou;Rien Ne Va Plus;Archive.com
Csar Aira;Atos de Caridade;Livro Fsico
Madeleine Bourdouxhe;La Femme de Gilles;Archive.com
Mian Mian;Candy;Archive.com
Bentley Little;The Revelation;Archive.com
Margarita Liberaki;The Other Alexander;Archive.com
Sophie Jabs;Alice, the Sausage;Archive.com
Willem Frederik Hermans;An Untouched House;Archive.com
Cees Nooteboom;A Seguinte Histria:;Livro Fsico
Gerald Murnane;Tamarisk Row;Archive.com
Mary Butts;Armed with Madness;Archive.com
Lszl Krasznahorkai;A Mountain to the North, a Lake to the South, Paths to the West, a River to the East;Livro Fsico
Muriel Spark;Realidade e Sonhos;Livro Fsico
Patrick White;The Solid Mandala;Archive.com
Fay Weldon;The Life and Loves of a She Devil;Archive.com
Rayner Heppenstall;The Blaze of Noon;Archive.com
Christos Tsiolkas;The Slap;Archive.com
Elizabeth Jolley;The Well;Archive.com
Murray Bail;Holden's Performance;Archive.com
Murray Bail;Camouflage;Archive.com
Helen Garner;The Children's Bach;Archive.com
Washington Cucurto;El Amor Es Ms Que Una Novela De 500 Pginas;Livro Fsico
Jerome K. Jerome;Three Men in a Boat;Archive.com
Noemi Jaffe;Lili;Livro Fsico
Alberto Laiseca;La Hija de Kheops;Archive.com
Elizabeth Jolley;Milk and Honey;Archive.com
Colombe Schneck;Dezessete Anos;Livro Fsico
Carlos Fuentes;Instinto de Inez;Archive.com
Reinaldo Arenas;El Asalto;Archive.com
Elizabeth Jolley;The Newspaper of Claremont Street;Archive.com
Antonio di Benedetto;Zama;Archive.com
Patrick White;The Aunt's Story;Archive.com
Ivan Turguniev;Dirio de um Homem Suprfluo;Livro Fsico
Ivan Bnin;O Amor de Mtia;Livro Fsico
Gert Hofmann;The Parable of the Blind;Archive.com`;

const lines = rawCsv.split('\n');
const parsed = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith(';;')) continue;
  const parts = line.split(';');
  if (parts.length >= 3) {
    const author = parts[0].trim();
    const title = parts[1].trim();
    const fmt = parts[2].trim();
    if (author && title && fmt) {
      parsed.push({ author, title, fmt });
    }
  }
}

console.log('Parsed rows:', parsed.length);

// Normalize helper
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-0]/g, '');
}

function mapFormat(fmt) {
  if (fmt.includes('Kindle')) return 'Kindle';
  if (fmt.includes('PDF')) return 'PDF';
  if (fmt.includes('Audible')) return 'Audible';
  if (fmt.includes('Archive')) return 'Archive.org';
  return 'Físico';
}

const fileContent = fs.readFileSync('src/data/initialBooks.ts', 'utf8');
const match = fileContent.match(/INITIAL_BOOKS: Book\[\] = (\[[\s\S]*\]);/);
const books = JSON.parse(match[1]);

let updatedCount = 0;
let notFound = [];

// Create map of normalized (author + title) -> parsed item
const parsedMap = new Map();
parsed.forEach((p, idx) => {
  const key = normalize(p.author) + '||' + normalize(p.title);
  parsedMap.set(key, p);
});

// Also try matching by title alone if author matches closely
books.forEach(b => {
  const normTitle = normalize(b.title);
  const normAuthor = normalize(b.author);
  const exactKey = normAuthor + '||' + normTitle;
  
  let match = parsedMap.get(exactKey);
  if (!match) {
    // Try matching by title alone among parsed items
    for (const p of parsed) {
      if (normalize(p.title) === normTitle) {
        match = p;
        break;
      }
    }
  }
  
  if (match) {
    const newFmt = mapFormat(match.fmt);
    if (b.format !== newFmt) {
      // console.log(`Book ID ${b.id}: "${b.title}" by ${b.author}: ${b.format} -> ${newFmt}`);
      b.format = newFmt;
      updatedCount++;
    }
  } else {
    notFound.push(b);
  }
});

console.log(`Updated formats for ${updatedCount} books.`);
console.log(`Books in INITIAL_BOOKS not found in CSV: ${notFound.length}`);
if (notFound.length > 0 && notFound.length < 20) {
  console.log('Sample not found:', notFound.map(b => `${b.author} - ${b.title}`));
}
