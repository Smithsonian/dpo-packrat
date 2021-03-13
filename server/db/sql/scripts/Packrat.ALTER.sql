-- 2021-03-13 Jon
DROP TABLE IF EXISTS `Job`;
DROP TABLE IF EXISTS `JobTask`;
DROP TABLE IF EXISTS `JobTaskCook`;

CREATE TABLE IF NOT EXISTS `Job` (
  `idJob` int(11) NOT NULL AUTO_INCREMENT,
  `idVJobType` int(11) NOT NULL,
  `Name` varchar(80) NOT NULL,
  `Status` int(11) NOT NULL,
  `Frequency` varchar(80) NOT NULL,
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
INSERT INTO Vocabulary (idVocabularySet, SortOrder, Term) VALUES (21, 1, 'Cook: Inspect Mesh');
