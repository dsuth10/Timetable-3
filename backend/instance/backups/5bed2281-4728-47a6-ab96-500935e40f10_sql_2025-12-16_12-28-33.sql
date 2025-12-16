BEGIN TRANSACTION;
CREATE TABLE "absences" (
	id INTEGER NOT NULL, 
	aide_id INTEGER NOT NULL, 
	date DATE NOT NULL, 
	reason TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_absence_aide_date UNIQUE (aide_id, date), 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE CASCADE
);
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO "alembic_version" VALUES('004_rename_qualifications_to_details');
CREATE TABLE "assignments" (
	id INTEGER NOT NULL, 
	task_id INTEGER NOT NULL, 
	aide_id INTEGER, 
	date DATE NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	status VARCHAR(20) DEFAULT 'UNASSIGNED' NOT NULL, 
	version INTEGER DEFAULT '1' NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	recurring_series_id INTEGER, 
	original_aide_id INTEGER, 
	PRIMARY KEY (id), 
	CONSTRAINT fk_assignments_recurring_series FOREIGN KEY(recurring_series_id) REFERENCES recurring_series (id) ON DELETE CASCADE, 
	CONSTRAINT fk_assignments_original_aide_id FOREIGN KEY(original_aide_id) REFERENCES teacher_aides (id) ON DELETE SET NULL, 
	FOREIGN KEY(task_id) REFERENCES tasks (id) ON DELETE CASCADE, 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE SET NULL
);
INSERT INTO "assignments" VALUES(1,1,1,'2025-12-18','09:10:00.000000','10:10:00.000000','ASSIGNED',2,'2025-12-15 12:16:55.530540','2025-12-15 12:17:04.530671',NULL,NULL);
INSERT INTO "assignments" VALUES(2,1,4,'2025-12-16','09:10:00.000000','09:40:00.000000','ASSIGNED',1,'2025-12-15 12:17:55.815110','2025-12-15 12:17:55.815112',NULL,NULL);
INSERT INTO "assignments" VALUES(3,1,4,'2025-12-17','10:10:00.000000','10:40:00.000000','ASSIGNED',1,'2025-12-15 12:18:20.477680','2025-12-15 12:18:20.477682',NULL,NULL);
INSERT INTO "assignments" VALUES(4,2,2,'2025-12-17','10:40:00.000000','11:10:00.000000','ASSIGNED',5,'2025-12-15 12:18:53.335745','2025-12-16 02:06:52.760901',NULL,NULL);
CREATE TABLE "availability" (
	id INTEGER NOT NULL, 
	aide_id INTEGER NOT NULL, 
	weekday VARCHAR(2) NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_availability_aide_day_time UNIQUE (aide_id, weekday, start_time), 
	FOREIGN KEY(aide_id) REFERENCES teacher_aides (id) ON DELETE CASCADE
);
INSERT INTO "availability" VALUES(2,1,'TU','08:00:00.000000','16:00:00.000000');
INSERT INTO "availability" VALUES(4,1,'TH','08:00:00.000000','16:00:00.000000');
INSERT INTO "availability" VALUES(5,1,'FR','08:00:00.000000','16:00:00.000000');
INSERT INTO "availability" VALUES(9,2,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(10,2,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(11,1,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(12,1,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(18,4,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(19,4,'TU','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(20,4,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(21,4,'FR','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(22,4,'TH','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(23,2,'MO','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(24,2,'WE','08:50:00.000000','15:00:00.000000');
INSERT INTO "availability" VALUES(25,2,'FR','08:50:00.000000','15:00:00.000000');
CREATE TABLE "classrooms" (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	capacity INTEGER, 
	notes TEXT, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	room_number VARCHAR(20) NOT NULL, 
	teacher VARCHAR(100) NOT NULL, year_level VARCHAR(50), is_composite BOOLEAN DEFAULT '0' NOT NULL, composite_year_levels VARCHAR(50), 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
INSERT INTO "classrooms" VALUES(1,'3A',25,'Grade 3A - Mrs. Anderson','2025-11-30 03:45:56.353302','101','Mrs. Anderson','3',0,NULL);
INSERT INTO "classrooms" VALUES(2,'3B',22,'Grade 3B - Mr. Thompson','2025-11-30 03:45:56.353303','102','Mr. Thompson','3',0,NULL);
INSERT INTO "classrooms" VALUES(3,'4A',28,'Grade 4A - Ms. Rodriguez','2025-11-30 03:45:56.353304','201','Ms. Rodriguez','4',0,NULL);
INSERT INTO "classrooms" VALUES(4,'Library',50,'Multi-purpose learning space','2025-11-30 03:45:56.353305','LIB','Mrs. Librarian',NULL,1,'Prep,1,2,3,4,5,6');
INSERT INTO "classrooms" VALUES(5,'Playground',100,'Outdoor supervision area','2025-11-30 03:45:56.353305','OUT','N/A',NULL,1,'Prep,1,2');
INSERT INTO "classrooms" VALUES(6,'5C',NULL,'tech heavy','2025-11-30 04:23:30.929936','Room 302','Mr. Sutherland','5',0,NULL);
CREATE TABLE recurring_series (
	id INTEGER NOT NULL, 
	task_id INTEGER NOT NULL, 
	aide_id INTEGER, 
	recurrence_rule TEXT NOT NULL, 
	expires_on DATE NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	base_date DATE NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
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
	status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL
);
INSERT INTO "requests" VALUES(1,'Mrs. Anderson','Extra Reading Support Needed','CLASS_SUPPORT','2025-12-02','10:00:00.000000',1,'Student struggling with comprehension, needs 1:1 support','PENDING','2025-11-30 03:45:56.357374');
CREATE TABLE "tasks" (
	id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	category VARCHAR(20) NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	classroom_id INTEGER, 
	notes TEXT, 
	status VARCHAR(20) DEFAULT 'UNASSIGNED' NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL
);
INSERT INTO "tasks" VALUES(1,'5C Reading Support','CLASS_SUPPORT','09:00:00.000000','10:00:00.000000',6,NULL,'UNASSIGNED','2025-12-15 11:41:39.077197','2025-12-15 11:41:39.077199');
INSERT INTO "tasks" VALUES(2,'5C Maths Support','CLASS_SUPPORT','09:00:00.000000','10:00:00.000000',6,NULL,'UNASSIGNED','2025-12-15 12:18:53.009075','2025-12-15 12:18:53.009080');
CREATE TABLE teacher_aides (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	details TEXT, 
	colour_hex VARCHAR(7) NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "teacher_aides" VALUES(1,'John Smith','Special Education, Behavior Management','#FF5733','2025-11-30 03:45:56.350380','2025-11-30 03:45:56.350383');
INSERT INTO "teacher_aides" VALUES(2,'Mary Johnson','Reading Specialist, ESL Support','#BC2BDA','2025-11-30 03:45:56.350384','2025-12-02 12:34:50.731448');
INSERT INTO "teacher_aides" VALUES(4,'Jessica Smith','Graduate.','#FF0040','2025-12-07 04:34:32.727443','2025-12-07 04:34:32.727447');
CREATE INDEX ix_teacher_aides_name ON teacher_aides (name);
CREATE INDEX ix_requests_status ON requests (status);
CREATE INDEX idx_recurring_series_task ON recurring_series (task_id);
CREATE INDEX idx_recurring_series_aide ON recurring_series (aide_id);
CREATE INDEX ix_tasks_status ON tasks (status);
CREATE INDEX ix_tasks_category ON tasks (category);
CREATE INDEX ix_absences_date ON absences (date);
CREATE UNIQUE INDEX idx_absences_aide_date ON absences (aide_id, date);
CREATE INDEX idx_absences_date ON absences (date);
CREATE INDEX idx_availability_aide_weekday ON availability (aide_id, weekday);
CREATE UNIQUE INDEX idx_classrooms_name ON classrooms (name);
CREATE UNIQUE INDEX ix_classrooms_name ON classrooms (name);
CREATE INDEX ix_recurring_series_task_id ON recurring_series (task_id);
CREATE INDEX idx_requests_created_at ON requests (created_at);
CREATE INDEX idx_requests_status ON requests (status);
CREATE INDEX ix_requests_created_at ON requests (created_at);
CREATE INDEX idx_tasks_category ON tasks (category);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_teacher_aides_name ON teacher_aides (name);
CREATE INDEX ix_assignments_task_id ON assignments (task_id);
CREATE INDEX idx_assignments_aide_date_time ON assignments (aide_id, date, start_time);
CREATE INDEX ix_assignments_recurring_series_id ON assignments (recurring_series_id);
CREATE INDEX ix_assignments_date ON assignments (date);
CREATE INDEX idx_assignments_status_date ON assignments (status, date, start_time);
CREATE INDEX idx_assignments_task_id ON assignments (task_id);
CREATE INDEX idx_assignments_date ON assignments (date);
CREATE INDEX idx_assignments_relief_pool ON assignments (status, date);
CREATE INDEX idx_assignments_original_aide ON assignments (original_aide_id);
COMMIT;
