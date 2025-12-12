package zone

import (
	db_chardata "idlequest/internal/db/character"
	"idlequest/internal/session"
)

func savePlayerData(ses *session.Session) error {
	if ses.Client == nil || ses.Client.CharData() == nil {
		return nil
	}

	if err := db_chardata.UpdateCharacter(ses.Client.CharData(), ses.AccountID); err != nil {
		return err
	}

	return nil
}
