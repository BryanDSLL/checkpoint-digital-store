-- Seed: Dados iniciais da GameStore

-- Plataformas
INSERT INTO loja.plataformas (nome, slug, cor_hex) VALUES
('PlayStation 5', 'ps5', '#003791'),
('Xbox Series X', 'xbox', '#107C10'),
('Nintendo Switch', 'switch', '#E60012'),
('PC (Steam)', 'pc-steam', '#1b2838'),
('PC (Epic Games)', 'pc-epic', '#2F2F2F'),
('PlayStation 4', 'ps4', '#003791');

-- Categorias
INSERT INTO loja.categorias (nome, slug, descricao) VALUES
('Ação', 'acao', 'Jogos de ação com combate intenso'),
('RPG', 'rpg', 'Role-Playing Games com progressão de personagem'),
('Aventura', 'aventura', 'Jogos de exploração e narrativa'),
('Luta', 'luta', 'Jogos de combate 1v1'),
('Esporte', 'esporte', 'Futebol, basquete e outros esportes'),
('FPS', 'fps', 'First Person Shooter'),
('Corrida', 'corrida', 'Jogos de corrida e simuladores'),
('Estratégia', 'estrategia', 'Jogos de estratégia e gestão'),
('Terror', 'terror', 'Jogos de horror e suspense'),
('Plataforma', 'plataforma', 'Jogos de plataforma e pulos');

-- Jogos
INSERT INTO loja.jogos (
    slug, titulo, descricao, descricao_curta,
    imagem_capa, preco_original, preco_com_cupom, percentual_desconto,
    desenvolvedor, publicadora, data_lancamento, classificacao_etaria,
    destaque, lancamento, mais_vendido, em_promocao, tags
) VALUES
(
    'elden-ring',
    'Elden Ring',
    'Elden Ring é um RPG de ação em mundo aberto desenvolvido pela FromSoftware em colaboração com George R.R. Martin. Explore as Terras Intermédias, um reino repleto de mistérios, masmorras sombrias e chefes épicos. Com um sistema de combate profundo e uma narrativa complexa, cada encontro é um desafio que exige habilidade e estratégia.',
    'O RPG de ação em mundo aberto mais aclamado dos últimos anos. Explore as Terras Intermédias.',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop',
    299.90, 254.90, 15,
    'FromSoftware', 'Bandai Namco', '2022-02-25', '16+',
    TRUE, FALSE, TRUE, TRUE,
    ARRAY['RPG', 'Mundo Aberto', 'Difícil', 'Dark Fantasy', 'GOTY']
),
(
    'god-of-war-ragnarok',
    'God of War: Ragnarök',
    'Kratos e Atreus embarcam em uma jornada épica pelos Nove Reinos da mitologia nórdica. Com gráficos deslumbrantes e uma história emocionante sobre paternidade, sacrifício e destino, Ragnarök é uma obra-prima do entretenimento interativo.',
    'Kratos e Atreus enfrentam o fim dos mundos na maior aventura nórdica já contada.',
    'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=800&fit=crop',
    249.90, 199.90, 20,
    'Santa Monica Studio', 'PlayStation Studios', '2022-11-09', '16+',
    TRUE, FALSE, TRUE, TRUE,
    ARRAY['Ação', 'Aventura', 'Mitologia', 'Exclusivo PS']
),
(
    'spider-man-2',
    'Marvel''s Spider-Man 2',
    'Peter Parker e Miles Morales retornam com novas habilidades e história em Nova York. Enfrente inimigos como Venom e o Lagarto em uma aventura de super-herói sem precedentes. A maior e mais ambiciosa aventura do Homem-Aranha.',
    'Peter e Miles juntos em sua maior aventura. Nova York nunca foi tão perigosa.',
    'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&h=800&fit=crop',
    299.90, 269.90, 10,
    'Insomniac Games', 'PlayStation Studios', '2023-10-20', '16+',
    TRUE, FALSE, FALSE, FALSE,
    ARRAY['Ação', 'Super-Herói', 'Mundo Aberto', 'Exclusivo PS']
),
(
    'zelda-totk',
    'The Legend of Zelda: Tears of the Kingdom',
    'Link embarca em nova aventura pelo Reino de Hyrule após um misterioso fenômeno levanta ilhas no céu. Com poderes completamente novos, resolva puzzles, explore masmorras e salve Zelda em um dos maiores jogos já criados.',
    'Link explora os céus e as profundezas de Hyrule com poderes extraordinários.',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
    349.90, 314.90, 10,
    'Nintendo EPD', 'Nintendo', '2023-05-12', 'Livre',
    FALSE, FALSE, TRUE, FALSE,
    ARRAY['Aventura', 'Mundo Aberto', 'Puzzle', 'Nintendo']
),
(
    'hogwarts-legacy',
    'Hogwarts Legacy',
    'Viva a experiência de ser um estudante de Hogwarts no século XIX. Domine feitiços, explore o castelo e seus arredores, e descubra um segredo antigo que ameaça o mundo mágico. Um RPG de ação ambicioso no universo de Harry Potter.',
    'Seja o bruxo que sempre quis ser. Hogwarts espera por você.',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&h=800&fit=crop',
    249.90, 199.90, 20,
    'Avalanche Software', 'Warner Bros Games', '2023-02-10', '12+',
    FALSE, FALSE, TRUE, TRUE,
    ARRAY['RPG', 'Mundo Aberto', 'Harry Potter', 'Magia']
),
(
    'street-fighter-6',
    'Street Fighter 6',
    'A lenda dos jogos de luta está de volta com o sistema de batalha mais revolucionário da série. Com gráficos de nova geração, um modo World Tour expansivo e uma grade de personagens diversificada, SF6 é o jogo de luta definitivo.',
    'O rei dos jogos de luta retorna mais poderoso do que nunca.',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
    249.90, 224.90, 10,
    'Capcom', 'Capcom', '2023-06-02', '12+',
    FALSE, FALSE, FALSE, FALSE,
    ARRAY['Luta', 'Online', 'Competitivo']
),
(
    'cyberpunk-2077-phantom-liberty',
    'Cyberpunk 2077: Phantom Liberty',
    'V retorna a Night City em uma missão de espionagem no coração do novo bairro Dogtown. Com a expansão Phantom Liberty, o jogo que se transformou em uma obra-prima recebe sua maior adição de conteúdo, com novo final e horas de história.',
    'Night City nunca foi tão perigosa. A maior expansão de Cyberpunk 2077.',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop',
    199.90, 169.90, 15,
    'CD Projekt Red', 'CD Projekt', '2023-09-26', '18+',
    FALSE, FALSE, FALSE, TRUE,
    ARRAY['RPG', 'FPS', 'Mundo Aberto', 'Sci-Fi', 'Expansão']
),
(
    'final-fantasy-7-rebirth',
    'Final Fantasy VII Rebirth',
    'A segunda parte da trilogia remake de Final Fantasy VII. Cloud e seus companheiros continuam sua jornada para derrotar Sephiroth em um mundo vastamente expandido com mecânicas de combate refinadas e uma narrativa emocionante.',
    'A épica jornada de Cloud continua. Uma nova aventura em um mundo expandido.',
    'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&h=800&fit=crop',
    349.90, 297.90, 15,
    'Square Enix', 'Square Enix', '2024-02-29', '16+',
    TRUE, TRUE, FALSE, FALSE,
    ARRAY['JRPG', 'Ação', 'Exclusivo PS', 'Final Fantasy']
),
(
    'mortal-kombat-1',
    'Mortal Kombat 1',
    'Um novo universo nasce. Liu Kang, agora deus do fogo e protetor da Terra, criou uma nova linha do tempo. Mas velhas ameaças surgem novamente. Com gráficos nunca antes vistos na série e o novo sistema Kameo, MK1 redefine o gênero.',
    'Um universo recriado. As brutalidades mais impressionantes da história de MK.',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&h=800&fit=crop',
    299.90, 254.90, 15,
    'NetherRealm Studios', 'Warner Bros Games', '2023-09-19', '18+',
    FALSE, FALSE, FALSE, TRUE,
    ARRAY['Luta', 'Violência', 'Online', 'Brutality']
);

-- Relações jogos <-> plataformas
-- Elden Ring: PS5, Xbox, PC
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'elden-ring' AND p.slug IN ('ps5', 'xbox', 'pc-steam');

-- God of War: PS5
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'god-of-war-ragnarok' AND p.slug IN ('ps5', 'ps4');

-- Spider-Man 2: PS5
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'spider-man-2' AND p.slug = 'ps5';

-- Zelda: Switch
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'zelda-totk' AND p.slug = 'switch';

-- Hogwarts: PS5, Xbox, PC
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'hogwarts-legacy' AND p.slug IN ('ps5', 'xbox', 'pc-steam');

-- SF6: PS5, Xbox, PC
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'street-fighter-6' AND p.slug IN ('ps5', 'xbox', 'pc-steam');

-- Cyberpunk: PS5, Xbox, PC
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'cyberpunk-2077-phantom-liberty' AND p.slug IN ('ps5', 'xbox', 'pc-steam');

-- FF7 Rebirth: PS5
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'final-fantasy-7-rebirth' AND p.slug = 'ps5';

-- MK1: PS5, Xbox, PC, Switch
INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id)
SELECT j.id, p.id FROM loja.jogos j, loja.plataformas p
WHERE j.slug = 'mortal-kombat-1' AND p.slug IN ('ps5', 'xbox', 'pc-steam', 'switch');

-- Relações jogos <-> categorias
INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'elden-ring' AND c.slug IN ('rpg', 'acao');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'god-of-war-ragnarok' AND c.slug IN ('acao', 'aventura');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'spider-man-2' AND c.slug IN ('acao', 'aventura');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'zelda-totk' AND c.slug IN ('aventura', 'rpg');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'hogwarts-legacy' AND c.slug IN ('rpg', 'aventura');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'street-fighter-6' AND c.slug = 'luta';

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'cyberpunk-2077-phantom-liberty' AND c.slug IN ('rpg', 'fps');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'final-fantasy-7-rebirth' AND c.slug IN ('rpg', 'acao');

INSERT INTO loja.jogos_categorias (jogo_id, categoria_id)
SELECT j.id, c.id FROM loja.jogos j, loja.categorias c
WHERE j.slug = 'mortal-kombat-1' AND c.slug = 'luta';

-- Links de afiliado (EXEMPLOS - substitua pelos links reais com cupom)
-- Elden Ring
INSERT INTO loja.links_afiliado (jogo_id, plataforma_id, nome_loja, url_afiliado, codigo_cupom, preco_loja, preco_loja_com_cupom, destaque, ordem)
SELECT j.id, p.id, 'Nuuvem', 
    'https://www.nuuvem.com/item/elden-ring?ref=gamestore&coupon=GAMESTORE15',
    'GAMESTORE15', 299.90, 254.90, TRUE, 1
FROM loja.jogos j, loja.plataformas p WHERE j.slug = 'elden-ring' AND p.slug = 'pc-steam';

INSERT INTO loja.links_afiliado (jogo_id, plataforma_id, nome_loja, url_afiliado, codigo_cupom, preco_loja, preco_loja_com_cupom, destaque, ordem)
SELECT j.id, p.id, 'PlayStation Store',
    'https://store.playstation.com/pt-br/product/elden-ring?ref=gamestore',
    NULL, 299.90, 299.90, FALSE, 2
FROM loja.jogos j, loja.plataformas p WHERE j.slug = 'elden-ring' AND p.slug = 'ps5';

-- God of War
INSERT INTO loja.links_afiliado (jogo_id, plataforma_id, nome_loja, url_afiliado, codigo_cupom, preco_loja, preco_loja_com_cupom, destaque, ordem)
SELECT j.id, p.id, 'PlayStation Store',
    'https://store.playstation.com/pt-br/product/god-of-war-ragnarok?ref=gamestore',
    NULL, 249.90, 199.90, TRUE, 1
FROM loja.jogos j, loja.plataformas p WHERE j.slug = 'god-of-war-ragnarok' AND p.slug = 'ps5';

-- Hogwarts Legacy
INSERT INTO loja.links_afiliado (jogo_id, plataforma_id, nome_loja, url_afiliado, codigo_cupom, preco_loja, preco_loja_com_cupom, destaque, ordem)
SELECT j.id, p.id, 'Nuuvem',
    'https://www.nuuvem.com/item/hogwarts-legacy?ref=gamestore&coupon=GAMESTORE20',
    'GAMESTORE20', 249.90, 199.90, TRUE, 1
FROM loja.jogos j, loja.plataformas p WHERE j.slug = 'hogwarts-legacy' AND p.slug = 'pc-steam';

-- Admin padrão (troque a senha)
INSERT INTO loja.usuarios (nome, email, senha_hash, role) VALUES
('Admin', 'admin@gamestore.com', '$2b$10$PLACEHOLDER_HASH', 'admin');
