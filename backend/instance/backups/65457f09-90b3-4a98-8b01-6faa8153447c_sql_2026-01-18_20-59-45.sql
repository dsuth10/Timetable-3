BEGIN TRANSACTION;
CREATE TABLE absences (
	id INTEGER NOT NULL, 
	aide_id INTEGER NOT NULL, 
	date DATE NOT NULL, 
	reason TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_absence_aide_date UNIQUE (aide_id, date), 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE CASCADE
);
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO "alembic_version" VALUES('789d74da06c5');
CREATE TABLE assignments (
	id INTEGER NOT NULL, 
	task_id INTEGER NOT NULL, 
	aide_id INTEGER, 
	original_aide_id INTEGER, 
	recurring_series_id INTEGER, 
	date DATE NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	version INTEGER NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tasks (id) ON DELETE CASCADE, 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE SET NULL, 
	FOREIGN KEY(original_aide_id) REFERENCES teacher_aides (id) ON DELETE SET NULL, 
	FOREIGN KEY(recurring_series_id) REFERENCES recurring_series (id) ON DELETE CASCADE
);
INSERT INTO "assignments" VALUES(1,1,2,NULL,NULL,'2026-01-19','09:40:00.000000','11:10:00.000000','ASSIGNED',1,'2026-01-18 10:58:46.820265','2026-01-18 10:58:46.820268');
CREATE TABLE availability (
	id INTEGER NOT NULL, 
	aide_id INTEGER NOT NULL, 
	weekday VARCHAR(2) NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_availability_aide_day_time UNIQUE (aide_id, weekday, start_time), 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE CASCADE
);
INSERT INTO "availability" VALUES(1,1,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(2,1,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(3,1,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(4,1,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(5,1,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(6,2,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(7,2,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(8,2,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(9,2,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(10,2,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(11,3,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(12,3,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(13,3,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(14,3,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(15,3,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(16,4,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(17,4,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(18,4,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(19,4,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(20,4,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(21,5,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(22,5,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(23,5,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(24,5,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(25,5,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(26,6,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(27,6,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(28,6,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(29,6,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(30,6,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(31,7,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(32,7,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(33,7,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(34,7,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(35,7,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(36,8,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(37,8,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(38,8,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(39,8,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(40,8,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(41,9,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(42,9,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(43,9,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(44,9,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(45,9,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(46,10,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(47,10,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(48,10,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(49,10,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(50,10,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(51,11,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(52,11,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(53,11,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(54,11,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(55,11,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(56,12,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(57,12,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(58,12,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(59,12,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(60,12,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(61,13,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(62,13,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(63,13,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(64,13,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(65,13,'WE','08:50:00.000000','15:00:00.000000');
CREATE TABLE classrooms (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	room_number VARCHAR(20) DEFAULT 'TBD' NOT NULL, 
	teacher VARCHAR(100) DEFAULT 'TBD' NOT NULL, 
	capacity INTEGER, 
	notes TEXT, 
	year_level VARCHAR(50), 
	is_composite BOOLEAN NOT NULL, 
	composite_year_levels VARCHAR(50), 
	colour_hex VARCHAR(7) DEFAULT '#1976d2' NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "classrooms" VALUES(1,'Prep A','101','Handsome Pete',NULL,NULL,'Prep',0,NULL,'#ffeb3b','2026-01-18 10:56:24.647298');
INSERT INTO "classrooms" VALUES(2,'Prep B','102','Joey Jo-Jo',NULL,NULL,'Prep',0,NULL,'#ffc107','2026-01-18 10:56:24.649687');
INSERT INTO "classrooms" VALUES(3,'Prep C','103','Guy Incognito',NULL,NULL,'Prep',0,NULL,'#607d8b','2026-01-18 10:56:24.650046');
INSERT INTO "classrooms" VALUES(4,'1A','104','L.T. Smash',NULL,NULL,'1',0,NULL,'#8bc34a','2026-01-18 10:56:24.650353');
INSERT INTO "classrooms" VALUES(5,'1B','105','Leopold',NULL,NULL,'1',0,NULL,'#cddc39','2026-01-18 10:56:24.650785');
INSERT INTO "classrooms" VALUES(6,'1C','106','Poochie',NULL,NULL,'1',0,NULL,'#ff5722','2026-01-18 10:56:24.651129');
INSERT INTO "classrooms" VALUES(7,'2A','107','Frank Grimes Jr.',NULL,NULL,'2',0,NULL,'#3f51b5','2026-01-18 10:56:24.651431');
INSERT INTO "classrooms" VALUES(8,'2B','108','The Yes Guy',NULL,NULL,'2',0,NULL,'#dc004e','2026-01-18 10:56:24.651727');
INSERT INTO "classrooms" VALUES(9,'2C','109','İter Zˆrker',NULL,NULL,'2',0,NULL,'#ff9800','2026-01-18 10:56:24.652022');
INSERT INTO "classrooms" VALUES(10,'3A','110','Coach Lugash',NULL,NULL,'3',0,NULL,'#ffeb3b','2026-01-18 10:56:24.652334');
INSERT INTO "classrooms" VALUES(11,'3B','111','Ruth Powers',NULL,NULL,'3',0,NULL,'#4caf50','2026-01-18 10:56:24.652630');
INSERT INTO "classrooms" VALUES(12,'3C','112','Sam',NULL,NULL,'3',0,NULL,'#ffeb3b','2026-01-18 10:56:24.652924');
INSERT INTO "classrooms" VALUES(13,'4A','113','Larry',NULL,NULL,'4',0,NULL,'#795548','2026-01-18 10:56:24.653220');
INSERT INTO "classrooms" VALUES(14,'4B','114','Disco Stu',NULL,NULL,'4',0,NULL,'#1976d2','2026-01-18 10:56:24.653514');
INSERT INTO "classrooms" VALUES(15,'4C','115','The Rich Texan',NULL,NULL,'4',0,NULL,'#4caf50','2026-01-18 10:56:24.654071');
INSERT INTO "classrooms" VALUES(16,'5A','116','Lindsey Naegle',NULL,NULL,'5',0,NULL,'#4caf50','2026-01-18 10:56:24.654361');
INSERT INTO "classrooms" VALUES(17,'5B','117','Cookie Kwan',NULL,NULL,'5',0,NULL,'#ffeb3b','2026-01-18 10:56:24.654637');
INSERT INTO "classrooms" VALUES(18,'5C','118','Squeaky-Voiced Teen',NULL,NULL,'5',0,NULL,'#795548','2026-01-18 10:56:24.654907');
INSERT INTO "classrooms" VALUES(19,'6A','119','Scott Christian',NULL,NULL,'6',0,NULL,'#2196f3','2026-01-18 10:56:24.655182');
INSERT INTO "classrooms" VALUES(20,'6B','120','Doris Freedman',NULL,NULL,'6',0,NULL,'#ff9800','2026-01-18 10:56:24.655471');
INSERT INTO "classrooms" VALUES(21,'6C','121','Mindy Simmons',NULL,NULL,'6',0,NULL,'#3f51b5','2026-01-18 10:56:24.655755');
CREATE TABLE recurring_series (
	id INTEGER NOT NULL, 
	task_id INTEGER NOT NULL, 
	aide_id INTEGER, 
	recurrence_rule TEXT NOT NULL, 
	expires_on DATE NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	base_date DATE NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tasks (id) ON DELETE CASCADE, 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE SET NULL
);
CREATE TABLE requests (
	id INTEGER NOT NULL, 
	requesting_teacher VARCHAR(100) NOT NULL, 
	task_title VARCHAR(200) NOT NULL, 
	task_category VARCHAR(20) NOT NULL, 
	preferred_date DATE NOT NULL, 
	preferred_time TIME NOT NULL, 
	classroom_id INTEGER, 
	notes TEXT, 
	status VARCHAR(20) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL
);
CREATE TABLE tasks (
	id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	category VARCHAR(20) NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	classroom_id INTEGER, 
	notes TEXT, 
	status VARCHAR(20) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL
);
INSERT INTO "tasks" VALUES(1,'Reading groups','CLASS_SUPPORT','09:00:00.000000','10:00:00.000000',7,NULL,'UNASSIGNED','2026-01-18 10:58:30.883405','2026-01-18 10:58:30.883408');
CREATE TABLE teacher_aides (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	details TEXT, 
	colour_hex VARCHAR(7) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "teacher_aides" VALUES(1,'John Smith','Special Education Support','#2196F3','2026-01-18 10:56:56.688192','2026-01-18 10:56:56.688196');
INSERT INTO "teacher_aides" VALUES(2,'Jane Doe','ESL and Reading Specialist','#03A9F4','2026-01-18 10:56:56.693058','2026-01-18 10:56:56.693062');
INSERT INTO "teacher_aides" VALUES(3,'Mary Johnson',NULL,'#009688','2026-01-18 10:56:56.694589','2026-01-18 10:56:56.694593');
INSERT INTO "teacher_aides" VALUES(4,'Homer Simpson',NULL,'#FFEB3B','2026-01-18 10:56:56.695919','2026-01-18 10:56:56.695923');
INSERT INTO "teacher_aides" VALUES(5,'Marge Simpson',NULL,'#009688','2026-01-18 10:56:56.697121','2026-01-18 10:56:56.697124');
INSERT INTO "teacher_aides" VALUES(6,'Bart Simpson',NULL,'#00BCD4','2026-01-18 10:56:56.698128','2026-01-18 10:56:56.698130');
INSERT INTO "teacher_aides" VALUES(7,'Lisa Simpson',NULL,'#3F51B5','2026-01-18 10:56:56.700556','2026-01-18 10:56:56.700559');
INSERT INTO "teacher_aides" VALUES(8,'Maggie Simpson',NULL,'#CDDC39','2026-01-18 10:56:56.701686','2026-01-18 10:56:56.701688');
INSERT INTO "teacher_aides" VALUES(9,'Dan Castellaneta',NULL,'#00BCD4','2026-01-18 10:56:56.702882','2026-01-18 10:56:56.702886');
INSERT INTO "teacher_aides" VALUES(10,'Julie Kavner',NULL,'#3F51B5','2026-01-18 10:56:56.703964','2026-01-18 10:56:56.703967');
INSERT INTO "teacher_aides" VALUES(11,'Nancy Cartwright',NULL,'#FF5722','2026-01-18 10:56:56.704962','2026-01-18 10:56:56.704965');
INSERT INTO "teacher_aides" VALUES(12,'Yeardley Smith',NULL,'#3F51B5','2026-01-18 10:56:56.705910','2026-01-18 10:56:56.705912');
INSERT INTO "teacher_aides" VALUES(13,'Liz Georges',NULL,'#03A9F4','2026-01-18 10:56:56.706827','2026-01-18 10:56:56.706830');
CREATE INDEX ix_teacher_aides_name ON teacher_aides (name);
CREATE INDEX idx_teacher_aides_name ON teacher_aides (name);
CREATE UNIQUE INDEX ix_classrooms_name ON classrooms (name);
CREATE UNIQUE INDEX idx_classrooms_name ON classrooms (name);
CREATE INDEX idx_availability_aide_weekday ON availability (aide_id, weekday);
CREATE INDEX ix_tasks_category ON tasks (category);
CREATE INDEX ix_tasks_status ON tasks (status);
CREATE INDEX idx_tasks_category ON tasks (category);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE UNIQUE INDEX idx_absences_aide_date ON absences (aide_id, date);
CREATE INDEX idx_absences_date ON absences (date);
CREATE INDEX ix_absences_date ON absences (date);
CREATE INDEX ix_requests_created_at ON requests (created_at);
CREATE INDEX idx_requests_created_at ON requests (created_at);
CREATE INDEX idx_requests_status ON requests (status);
CREATE INDEX ix_requests_status ON requests (status);
CREATE INDEX idx_recurring_series_aide ON recurring_series (aide_id);
CREATE INDEX idx_recurring_series_task ON recurring_series (task_id);
CREATE INDEX ix_recurring_series_task_id ON recurring_series (task_id);
CREATE INDEX idx_assignments_status_date ON assignments (status, date, start_time);
CREATE INDEX idx_assignments_aide_date_time ON assignments (aide_id, date, start_time);
CREATE INDEX idx_assignments_task_id ON assignments (task_id);
CREATE INDEX idx_assignments_date ON assignments (date);
CREATE INDEX ix_assignments_original_aide_id ON assignments (original_aide_id);
CREATE INDEX ix_assignments_date ON assignments (date);
CREATE INDEX ix_assignments_recurring_series_id ON assignments (recurring_series_id);
CREATE INDEX ix_assignments_task_id ON assignments (task_id);
COMMIT;
