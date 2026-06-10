-- ============================================================
-- MapU — datos de demostración (generado desde src/data/mockProperties.ts)
-- Compatible con el esquema existente del proyecto (app móvil).
--
-- REQUISITO: debe existir al menos un perfil (crea una cuenta primero,
-- desde la web o la app móvil). Las propiedades demo se asignan al perfil
-- más antiguo y llevan el tag 'demo-seed' (re-ejecutar las regenera).
-- ============================================================

do $$
begin
  if not exists (select 1 from public.profiles) then
    raise exception 'No hay perfiles: crea una cuenta primero y vuelve a ejecutar este seed.';
  end if;
end $$;

delete from public.properties where 'demo-seed' = any(tags);

insert into public.properties (
  owner_id,
  title, description, type, operation, status,
  latitude, longitude,
  address_street, address_number, address_commune, address_city, address_region,
  price, currency, monthly_rent, is_negotiable,
  bedrooms, bathrooms, area, built_area, lot_size, parking_spots, floors, year_built,
  has_garden, has_pool, has_gym, has_security, has_elevator, has_balcony, has_terrace, has_air_conditioning, has_heating,
  pet_friendly, furnished, new_construction,
  images,
  contact_name, contact_phone, contact_email, contact_whatsapp, preferred_contact,
  published_at, expires_at,
  is_premium, is_featured, views, favorites_count, contacts_count,
  tags
) values
(
  (select id from public.profiles order by created_at asc limit 1),
  'Casa moderna en Las Condes', 'Hermosa casa moderna de 3 pisos en sector residencial de Las Condes. Amplios espacios, luminosa, con jardín y piscina. Excelente ubicación a pasos del metro Manquehue.', 'house', 'sale', 'active',
  -33.3985, -70.5712,
  'Av. Las Condes', '12450', 'Las Condes', 'Las Condes', 'Metropolitana',
  285000000, 'CLP', null, true,
  3, 3, 180, 180, null, 2, null, null,
  true, true, false, true, false, false, false, true, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/10/800/600","thumbnailUrl":"https://picsum.photos/seed/10/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/11/800/600","thumbnailUrl":"https://picsum.photos/seed/11/400/300","order":1,"isMain":false},{"id":"i3","url":"https://picsum.photos/seed/12/800/600","thumbnailUrl":"https://picsum.photos/seed/12/400/300","order":2,"isMain":false}]'::jsonb,
  'Carlos Fernández', '+56912345678', 'carlos@inmobiliaria.cl', '+56912345678', 'whatsapp',
  '2026-05-01', '2026-07-01',
  true, false, 342, 28, 12,
  array['piscina','jardín','metro cercano','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Departamento en Providencia', 'Moderno departamento en pleno corazón de Providencia. A pasos del metro Pedro de Valdivia. Terminaciones de primer nivel, cocina equipada, balcón con vista a la ciudad.', 'apartment', 'rent', 'active',
  -33.43, -70.6116,
  'Av. Pedro de Valdivia', '860', 'Providencia', 'Providencia', 'Metropolitana',
  75000000, 'CLP', 850000, false,
  2, 2, 75, null, null, 1, null, null,
  false, false, false, true, true, true, false, false, false,
  true, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/20/800/600","thumbnailUrl":"https://picsum.photos/seed/20/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/21/800/600","thumbnailUrl":"https://picsum.photos/seed/21/400/300","order":1,"isMain":false}]'::jsonb,
  'María González', '+56922345678', 'maria@propiedades.cl', '+56922345678', 'whatsapp',
  '2026-05-10', '2026-07-10',
  false, false, 189, 15, 8,
  array['metro','balcón','amoblado','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Casa familiar en Ñuñoa', 'Espaciosa casa familiar en el corazón de Ñuñoa. Ideal para familias con niños. Gran patio, cocina amplia, 4 dormitorios con walk-in closet en dormitorio principal.', 'house', 'sale', 'active',
  -33.4569, -70.598,
  'Irarrázaval', '2850', 'Ñuñoa', 'Ñuñoa', 'Metropolitana',
  195000000, 'CLP', null, true,
  4, 3, 220, 200, 300, 2, null, null,
  true, false, false, false, false, false, false, false, true,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/30/800/600","thumbnailUrl":"https://picsum.photos/seed/30/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/31/800/600","thumbnailUrl":"https://picsum.photos/seed/31/400/300","order":1,"isMain":false},{"id":"i3","url":"https://picsum.photos/seed/32/800/600","thumbnailUrl":"https://picsum.photos/seed/32/400/300","order":2,"isMain":false}]'::jsonb,
  'Carlos Fernández', '+56912345678', 'carlos@inmobiliaria.cl', '+56912345678', 'phone',
  '2026-04-15', '2026-06-15',
  false, true, 521, 41, 19,
  array['patio grande','familia','barrio tranquilo','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Penthouse en Vitacura con vista panorámica', 'Exclusivo penthouse en edificio de lujo en Vitacura. Terraza de 80m² con vista a la cordillera. Terminaciones premium, cocina gourmet, sala de estar y comedor amplios.', 'apartment', 'sale', 'active',
  -33.3875, -70.5804,
  'Av. Vitacura', '3650', 'Vitacura', 'Vitacura', 'Metropolitana',
  450000000, 'CLP', null, false,
  3, 3, 150, 150, null, 2, null, null,
  false, false, true, true, true, false, true, true, true,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/40/800/600","thumbnailUrl":"https://picsum.photos/seed/40/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/41/800/600","thumbnailUrl":"https://picsum.photos/seed/41/400/300","order":1,"isMain":false},{"id":"i3","url":"https://picsum.photos/seed/42/800/600","thumbnailUrl":"https://picsum.photos/seed/42/400/300","order":2,"isMain":false},{"id":"i4","url":"https://picsum.photos/seed/43/800/600","thumbnailUrl":"https://picsum.photos/seed/43/400/300","order":3,"isMain":false}]'::jsonb,
  'Inmobiliaria Premium', '+56932345678', 'premium@inmopropiedades.cl', '+56932345678', 'email',
  '2026-03-01', '2026-07-01',
  true, true, 892, 67, 25,
  array['lujo','vista cordillera','terraza','penthouse','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Departamento estudio en Barrio Italia', 'Moderno estudio en el trendiest barrio de Santiago. Diseño contemporáneo, espacios optimizados, cocina integrada al living. A pasos de cafés, restaurantes y vida cultural.', 'apartment', 'rent', 'active',
  -33.443, -70.629,
  'Av. Italia', '1450', 'Providencia', 'Santiago', 'Metropolitana',
  45000000, 'CLP', 550000, true,
  1, 1, 42, null, null, 0, null, null,
  false, false, false, false, true, false, false, false, false,
  false, true, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/50/800/600","thumbnailUrl":"https://picsum.photos/seed/50/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/51/800/600","thumbnailUrl":"https://picsum.photos/seed/51/400/300","order":1,"isMain":false}]'::jsonb,
  'María González', '+56922345678', 'maria@propiedades.cl', '+56922345678', 'whatsapp',
  '2026-05-20', '2026-07-20',
  false, false, 245, 31, 14,
  array['amoblado','barrio italia','estudio','céntrico','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Terreno en Lo Barnechea', 'Excelente terreno plano en sector residencial de Lo Barnechea. Ideal para construcción de casa o proyecto. Todos los servicios disponibles, acceso pavimentado.', 'land', 'sale', 'active',
  -33.355, -70.522,
  'Camino Las Flores', '890', 'Lo Barnechea', 'Lo Barnechea', 'Metropolitana',
  180000000, 'CLP', null, true,
  null, null, 500, null, 500, 0, null, null,
  false, false, false, false, false, false, false, false, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/60/800/600","thumbnailUrl":"https://picsum.photos/seed/60/400/300","order":0,"isMain":true}]'::jsonb,
  'Carlos Fernández', '+56912345678', 'carlos@inmobiliaria.cl', '+56912345678', 'phone',
  '2026-04-01', '2026-06-30',
  false, false, 178, 22, 9,
  array['terreno plano','todos servicios','Lo Barnechea','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Casa patrimonial en Cerro Alegre', 'Encantadora casa patrimonial en el icónico Cerro Alegre de Valparaíso. Amplias habitaciones, techos altos, vista al mar. Restaurada con materiales originales.', 'house', 'sale', 'active',
  -33.0452, -71.6268,
  'Pasaje Gálvez', '120', 'Valparaíso', 'Valparaíso', 'Valparaíso',
  220000000, 'CLP', null, true,
  3, 2, 150, 150, null, 0, null, 1920,
  true, false, false, false, false, false, false, false, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/70/800/600","thumbnailUrl":"https://picsum.photos/seed/70/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/71/800/600","thumbnailUrl":"https://picsum.photos/seed/71/400/300","order":1,"isMain":false}]'::jsonb,
  'Inmobiliaria Premium', '+56932345678', 'premium@inmopropiedades.cl', '+56932345678', 'email',
  '2026-05-05', '2026-07-05',
  true, false, 310, 45, 16,
  array['patrimonial','vista al mar','Cerro Alegre','Valparaíso','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Departamento frente al mar en Viña del Mar', 'Espectacular departamento con vista directa al mar en Viña del Mar. Totalmente amoblado y equipado. Edificio con piscina, gym y conserje 24 horas.', 'apartment', 'rent', 'active',
  -33.0238, -71.5518,
  'Av. Marina', '45', 'Viña del Mar', 'Viña del Mar', 'Valparaíso',
  90000000, 'CLP', 750000, false,
  2, 1, 80, null, null, 1, null, null,
  false, true, true, true, true, false, false, false, false,
  false, true, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/80/800/600","thumbnailUrl":"https://picsum.photos/seed/80/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/81/800/600","thumbnailUrl":"https://picsum.photos/seed/81/400/300","order":1,"isMain":false}]'::jsonb,
  'María González', '+56922345678', 'maria@propiedades.cl', '+56922345678', 'whatsapp',
  '2026-05-15', '2026-07-15',
  true, false, 423, 52, 21,
  array['vista al mar','amoblado','gym','piscina','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Casa nueva en Concepción', 'Casa nueva entregada en llave en mano en Concepción. Proyecto de primera categoría con materiales de calidad. 3 dormitorios, 2 baños, cocina americana y jardín privado.', 'house', 'sale', 'active',
  -36.827, -73.0498,
  'Av. Los Alamos', '1250', 'Concepción', 'Concepción', 'Biobío',
  85000000, 'CLP', null, false,
  3, 2, 130, 110, null, 1, null, null,
  true, false, false, false, false, false, false, false, false,
  false, false, true,
  '[{"id":"i1","url":"https://picsum.photos/seed/90/800/600","thumbnailUrl":"https://picsum.photos/seed/90/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/91/800/600","thumbnailUrl":"https://picsum.photos/seed/91/400/300","order":1,"isMain":false}]'::jsonb,
  'Carlos Fernández', '+56912345678', 'carlos@inmobiliaria.cl', '+56912345678', 'phone',
  '2026-04-20', '2026-06-20',
  false, false, 234, 18, 7,
  array['nueva construcción','llave en mano','jardín','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Casa en La Serena cerca del mar', 'Hermosa casa en La Serena a solo 500 metros de la playa. Ideal para vivir o como inversión turística. Amplios espacios, piscina, terraza y quincho.', 'house', 'sale', 'active',
  -29.9533, -71.2606,
  'Av. del Mar', '3450', 'La Serena', 'La Serena', 'Coquimbo',
  120000000, 'CLP', null, true,
  3, 2, 160, 140, 300, 2, null, null,
  true, true, false, false, false, false, true, false, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/100/800/600","thumbnailUrl":"https://picsum.photos/seed/100/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/101/800/600","thumbnailUrl":"https://picsum.photos/seed/101/400/300","order":1,"isMain":false}]'::jsonb,
  'Inmobiliaria Premium', '+56932345678', 'premium@inmopropiedades.cl', '+56932345678', 'email',
  '2026-05-01', '2026-06-30',
  false, true, 389, 44, 17,
  array['playa','piscina','inversión','La Serena','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Oficina en Santiago Centro', 'Moderna oficina en el corazón de Santiago, piso 12 con vista panorámica. Espacios abiertos o divisibles, sala de reuniones, recepción compartida y estacionamientos.', 'office', 'rent', 'active',
  -33.442, -70.6509,
  'Av. Libertador Bernardo O''Higgins', '1234', 'Santiago', 'Santiago', 'Metropolitana',
  40000000, 'CLP', 1200000, true,
  null, null, 120, null, null, 2, null, null,
  false, false, false, true, true, false, false, true, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/110/800/600","thumbnailUrl":"https://picsum.photos/seed/110/400/300","order":0,"isMain":true}]'::jsonb,
  'María González', '+56922345678', 'maria@propiedades.cl', '+56922345678', 'email',
  '2026-05-18', '2026-07-18',
  false, false, 156, 9, 5,
  array['oficina','centro','metro','vista panorámica','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Departamento en Miraflores con logia', 'Cómodo departamento con logia en barrio Miraflores, Santiago. Luminoso, bien ubicado, a minutos del metro Baquedano. Perfecto para estudiantes o profesionales.', 'apartment', 'sale', 'active',
  -33.438, -70.635,
  'Miraflores', '750', 'Santiago', 'Santiago', 'Metropolitana',
  120000000, 'CLP', null, true,
  2, 1, 65, null, null, 0, null, null,
  false, false, false, false, true, true, false, false, false,
  true, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/120/800/600","thumbnailUrl":"https://picsum.photos/seed/120/400/300","order":0,"isMain":true},{"id":"i2","url":"https://picsum.photos/seed/121/800/600","thumbnailUrl":"https://picsum.photos/seed/121/400/300","order":1,"isMain":false}]'::jsonb,
  'Carlos Fernández', '+56912345678', 'carlos@inmobiliaria.cl', '+56912345678', 'whatsapp',
  '2026-05-25', '2026-07-25',
  false, false, 201, 19, 6,
  array['metro Baquedano','logia','mascotas ok','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Local comercial en Providencia', 'Excelente local comercial en Av. Providencia. Alta afluencia de público, vidriera amplia, bodega posterior. Ideal para restaurant, café, boutique o cualquier comercio.', 'commercial', 'rent', 'active',
  -33.428, -70.608,
  'Av. Providencia', '2140', 'Providencia', 'Providencia', 'Metropolitana',
  30000000, 'CLP', 2500000, true,
  null, null, 80, null, null, 0, null, null,
  false, false, false, false, false, false, false, false, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/130/800/600","thumbnailUrl":"https://picsum.photos/seed/130/400/300","order":0,"isMain":true}]'::jsonb,
  'Inmobiliaria Premium', '+56932345678', 'premium@inmopropiedades.cl', '+56932345678', 'phone',
  '2026-05-08', '2026-07-08',
  false, false, 98, 7, 4,
  array['local','alta afluencia','bodega','Providencia','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Departamento en Antofagasta cerca del centro', 'Cómodo departamento en Antofagasta, sector céntrico y seguro. Edificio con vigilancia, estacionamiento incluido. A pasos de servicios, supermercados y transporte.', 'apartment', 'rent', 'active',
  -23.6524, -70.3954,
  'Av. Argentina', '2250', 'Antofagasta', 'Antofagasta', 'Antofagasta',
  35000000, 'CLP', 500000, false,
  2, 1, 60, null, null, 1, null, null,
  false, false, false, true, true, false, false, false, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/140/800/600","thumbnailUrl":"https://picsum.photos/seed/140/400/300","order":0,"isMain":true}]'::jsonb,
  'María González', '+56922345678', 'maria@propiedades.cl', '+56922345678', 'whatsapp',
  '2026-05-22', '2026-07-22',
  false, false, 134, 11, 4,
  array['céntrico','seguro','estacionamiento','demo-seed']
),
(
  (select id from public.profiles order by created_at asc limit 1),
  'Casa amplia en Lo Espejo', 'Amplia casa en Lo Espejo, ideal para familia numerosa o como inversión de arriendo. Gran patio trasero, 5 dormitorios. Barrio tranquilo con acceso a metro.', 'house', 'sale', 'active',
  -33.505, -70.696,
  'Los Cerezos', '1560', 'Lo Espejo', 'Lo Espejo', 'Metropolitana',
  65000000, 'CLP', null, true,
  5, 2, 180, 160, 200, 1, null, null,
  true, false, false, false, false, false, false, false, false,
  false, false, false,
  '[{"id":"i1","url":"https://picsum.photos/seed/150/800/600","thumbnailUrl":"https://picsum.photos/seed/150/400/300","order":0,"isMain":true}]'::jsonb,
  'Carlos Fernández', '+56912345678', 'carlos@inmobiliaria.cl', '+56912345678', 'phone',
  '2026-04-28', '2026-06-28',
  false, false, 267, 23, 10,
  array['amplia','5 dormitorios','inversión','metro cercano','demo-seed']
);
