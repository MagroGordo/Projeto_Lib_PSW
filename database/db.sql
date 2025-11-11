-- Criação da base de dados
-- Tabela de utilizadores
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de géneros
CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Tabela de livros
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20),
    page_count INT,
    publication_year INT,
    editor VARCHAR(100),
    description TEXT,
    image VARCHAR(255)
);

-- Inserção dos livros (com CONCAT para caminho da imagem)
INSERT INTO books (id, title, author, isbn, page_count, publication_year, editor, description, image)
VALUES
(1, 'The Invention of Hugo Cabret', 'Brian Selznick', '9784372340711', 307, 2007, 'Brian Selznick', 'In 1931, orphan Hugo Cabret lives hidden in a Paris train station...', CONCAT('images/', '1.jpg')),
(2, 'Dune', 'Frank Herbert', '978869154771', 209, 1965, 'Nova Fronteira e Editora Aleph', 'The desert planet Arrakis — known as Dune — has long...', CONCAT('images/', '2.jpg')),
(3, 'The Bad Beginning', 'Lemony Snicket', '978659124619', 162, 2016, 'Terramar', 'This is the first volume in a series in which Lemony...', CONCAT('images/', '3.jpg')),
(4, 'Los Hombres que no Amaban a las Mujeres', 'Stieg Larsson', '9786988397680', 720, 2015, 'Companhia das Letras', 'It’s just a preview of the tension that unfolds in...', CONCAT('images/', '4.jpg')),
(5, 'Psychology of Money', 'Morgan Housel', '9780409885846', 254, 2021, 'Editorial Presença', 'Being successful with money does not necessarily...', CONCAT('images/', '5.jpg')),
(6, 'Secrets of the Millionaire Mind', 'T. Harv Eker', '9781264108161', 224, 2014, 'Marcador', 'Wanna win for all those who wonder why some people...', CONCAT('images/', '6.jpg')),
(7, 'Rich Dad, Poor Dad', 'Robert T. Kiyosaki', '9780123140153', 336, 2023, 'Vogais', 'It dispels the myth that you need a high salary to...', CONCAT('images/', '7.jpg')),
(8, 'Think and Grow Rich', 'Napolean Hill', '9781833293962', 230, 2011, 'Lua de Papel', 'The most influential business self-help book in...', CONCAT('images/', '8.jpg')),
(9, 'The Truth About the Harry Quebert Affair', 'Joël Dicker', '9782231120687', 320, 2013, 'Alfaguara', 'Convinced of Harry’s innocence, Marcus abandons...', CONCAT('images/', '9.jpg')),
(10, 'The Hound of the Baskervilles', 'Arthur Conan Doyle', '9780099529059', 240, 2010, 'Bertrand Editora', 'For two centuries, Baskerville Hall has been home...', CONCAT('images/', '10.jpg')),
(11, 'Misery', 'Stephen King', '9780380763038', 400, 2013, 'Bertrand Editora', 'Paul Sheldon is a famous writer of romance novels...', CONCAT('images/', '11.jpg')),
(12, 'Dirty Game', 'Jessie Keane', '9789692735991', 561, 2015, 'Marcador', 'John Connolly and James "Whitey" Bulger grew up...', CONCAT('images/', '12.jpg')),
(13, 'O Hospital de Alfaces', 'Pedro Chagas Freitas', '97895392559604', 645, 2024, 'Oficina de Livro', 'The story of three generations: grandfather, father...', CONCAT('images/', '13.jpg')),
(14, 'My name is Emília del Valle', 'Isabel Allende', '9781087769547', 300, 2025, 'Porto Editora', 'A fascinating story of self-discovery and love...', CONCAT('images/', '14.jpg')),
(15, 'Yours, Forever', 'Leonor Soliz', '9787921835972', 314, 2025, 'Manuscrito Editora', 'Olivia has a plan. It’s not brilliant. Nor is it sensible...', CONCAT('images/', '15.jpg')),
(16, 'Verity', 'Colleen Hoover', '9789170025119', 290, 2019, 'TopSeller', 'Lowen Ashleigh is a writer struggling with serious...', CONCAT('images/', '16.jpg')),
(17, 'Auto da Barca do Inferno', 'Gil Vicente', '9789505972708', 64, 1517, 'Porto Editora', 'An allegorical play that portrays the judgment of...', CONCAT('images/', '17.jpg')),
(18, 'Memorial do Convento', 'José Saramago', '9784347997587', 427, 1982, 'Porto Editora', 'A historical and allegorical novel that intertwines...', CONCAT('images/', '18.jpg')),
(19, 'Os Lusíadas', 'Luís de Camões', '9781564781178', 648, 1572, 'Porto Editora', 'An epic poem that celebrates the great deeds of...', CONCAT('images/', '19.jpg')),
(20, 'Os Maias', 'Eça de Queirós', '9785533644033', 736, 1888, 'Porto Editora', 'A realist novel that portrays the decline of a...', CONCAT('images/', '20.jpg'));

-- Tabela de ratings
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Tabela de relação entre livros e utilizadores (favoritos e leitura)
CREATE TABLE books_users_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    is_favorite TINYINT(1) DEFAULT 0,
    is_read TINYINT(1) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);