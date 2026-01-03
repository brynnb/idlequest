-- Correcting and expanding zone descriptions with proper zoneidnumbers
TRUNCATE TABLE zone_descriptions;

INSERT INTO zone_descriptions (zone_id, description, welcome) VALUES
(55, 'Ak\'Anon - City of the Gnomes', 'Welcome to Ak\'Anon, the mysterious, magical, mechanical home of the Gnomes!'),
(2, 'Qeynos - City of Men', 'Welcome to Qeynos! Qeynos is a busy human port city that is dedicated to the principles of law and ruled over by the strong, benevolent hand of Antonius Bayle.'),
(29, 'Halas - City of the Barbarians', 'Welcome to Halas, the snowy northern home of the Barbarians!'),
(19, 'Rivervale - City of the Halflings', 'Welcome to Rivervale, home and heart of the Halflings!'),
(9, 'Freeport - City of Men', 'Welcome to Freeport! Freeport is a bustling human port town with more than its share of seedy characters.'),
(41, 'Neriak - City of the Dark Elves', 'Welcome to Neriak! Dark and damp, Neriak is home to the sons and daughters of Innoruuk, the Teir\'Dal.'),
(52, 'Grobb - City of the Trolls', 'Welcome to Grobb, the primitive and murky home of the Trolls! Built from the rot and mud of the Innothule Swamp, it is a place where only the strong survive and the weak are eaten.'),
(49, 'Oggok - City of the Ogres', 'Welcome to Oggok, mountain home of the Ogres!'),
(67, 'Kaladim - City of the Dwarves', 'Welcome to Kaladim, The Forge of Norrath!'),
(54, 'Kelethin - City of the Wood Elves', 'Welcome to Kelethin, City in the Trees and home of the Woodland Elves!'),
(61, 'Felwithe - City of the High Elves', 'Welcome to Felwithe, the site of rebirth for the High Elves of Norrath!'),
(106, 'Cabilis - City of the Iksar', 'Welcome to Cabilis, the new capital of the reborn Iksar Empire.'),
(155, 'Shar Vahl - City of the Vah Shir', 'Welcome to the Palace of Shar Vahl, residence of the honorable Vah Shir themselves.'),
(24, 'Erudin - City of the Erudites', 'Welcome to Erudin, city of high men and knowledge!'),
(75, 'Paineel - City of the Heretics', 'Welcome to Paineel, the dark bastion of the Erudite Heretics. Within its gray walls, the arts of necromancy and shadow-weaving are practiced in service to The Faceless (Cazic-Thule).');
