from . import db

class TermWeek(db.Model):
    __tablename__ = 'term_weeks'

    date = db.Column(db.Date, primary_key=True)
    term_number = db.Column(db.Integer, nullable=True)
    week_number = db.Column(db.Integer, nullable=True)
    # e.g. "Term 1, Week 3" or just "Holiday" if term is null
    display_label = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'date': self.date.isoformat(),
            'term_number': self.term_number,
            'week_number': self.week_number,
            'display_label': self.display_label
        }
