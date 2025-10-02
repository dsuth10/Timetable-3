describe('Absence Handling', () => {
  it('creates an absence for an aide', () => {
    cy.intercept('GET', '/api/aides*', { body: [{ id: 1, name: 'John Smith' }] }).as('getAides');
    cy.intercept('GET', '/api/assignments/weekly-matrix*', { assignments: [] }).as('getMatrix');
    cy.intercept('POST', '/api/absences', (req) => {
      expect(req.body.aide_id).to.equal(1);
      expect(req.body.date).to.equal('2025-10-06');
      req.reply({ id: 99, aide_id: 1, date: '2025-10-06', reason: 'Illness' });
    }).as('createAbsence');

    cy.visit('/');
    cy.wait('@getAides');
    cy.wait('@getMatrix');

    // Open absence modal via a test hook (assume a button exists in UI in future; for now trigger event)
    cy.window().then((w: any) => {
      w.dispatchEvent(new CustomEvent('ui:openAbsenceTest'));
    });

    // Fill form
    cy.get('[data-testid="absence-aide"]').select('John Smith');
    cy.get('[data-testid="absence-date"]').type('2025-10-06');
    cy.get('[data-testid="absence-reason"]').type('Illness');
    cy.get('[data-testid="absence-submit"]').click();

    cy.wait('@createAbsence');
  });
});


