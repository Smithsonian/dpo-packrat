-- 2021-03-13 Jon
DROP TABLE IF EXISTS `Job`;
DROP TABLE IF EXISTS `JobTask`;
DROP TABLE IF EXISTS `JobTaskCook`;

CREATE TABLE IF NOT EXISTS `Job` (
  `idJob` int(11) NOT NULL AUTO_INCREMENT,
  `idVJobType` int(11) NOT NULL,
  `Name` varchar(80) NOT NULL,
  `Status` int(11) NOT NULL,
  `Frequency` varchar(80) NULL,
  PRIMARY KEY (`idJob`),
  KEY `Job_idVJobType_idJob` (`idVJobType`, `idJob`),
  KEY `Job_Name` (`Name`),
  KEY `Job_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE IF NOT EXISTS `JobRun` (
  `idJobRun` int(11) NOT NULL AUTO_INCREMENT,
  `idJob` int(11) NOT NULL,
  `Status` int(11) NOT NULL,
  `Result` boolean NULL,
  `DateStart` datetime NULL,
  `DateEnd` datetime NULL,
  `Configuration` text NULL,
  `Parameters` text NULL,
  `Output` text NULL,
  `Error` text NULL,
  PRIMARY KEY (`idJobRun`),
  KEY `JobRun_idJob` (`idJob`),
  KEY `JobRun_Status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

ALTER TABLE `Job` 
ADD CONSTRAINT `fk_job_vocabulary1`
  FOREIGN KEY (`idVJobType`)
  REFERENCES `Vocabulary` (`idVocabulary`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `JobRun` 
ADD CONSTRAINT `fk_jobrun_job1`
  FOREIGN KEY (`idJob`)
  REFERENCES `Job` (`idJob`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

INSERT INTO VocabularySet (idVocabularySet, Name, SystemMaintained) VALUES (21, 'Job.JobType', 1);
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 1, 'Cook: bake');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 2, 'Cook: decimate-unwrap');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 3, 'Cook: decimate');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 4, 'Cook: generate-usdz');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 5, 'Cook: generate-web-gltf');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 6, 'Cook: inspect-mesh');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 7, 'Cook: si-ar-backfill-fix');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 8, 'Cook: si-generate-downloads');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 9, 'Cook: si-orient-model-to-svx');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 10, 'Cook: si-packrat-inspect');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 11, 'Cook: si-voyager-asset');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 12, 'Cook: si-voyager-scene');
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 13, 'Cook: unwrap');

INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: bake';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: decimate-unwrap';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: decimate';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: generate-usdz';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: generate-web-gltf';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: inspect-mesh';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: si-ar-backfill-fix';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: si-generate-downloads';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: si-orient-model-to-svx';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: si-packrat-inspect';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: si-voyager-asset';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: si-voyager-scene';
INSERT INTO Job (idVJobType, Name, Status, Frequency) SELECT idVocabulary, Term, 1, NULL FROM Vocabulary WHERE Term = 'Cook: unwrap';

