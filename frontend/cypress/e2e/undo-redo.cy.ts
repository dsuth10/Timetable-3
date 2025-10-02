describe('Undo/Redo', () => {
  it('undos and redos a drag assignment', () => {
    cy.intercept('GET', '/api/assignments/weekly-matrix*', {
      assignments: [
        { id: 10, task_id: 100, aide_id: 1, date: '2025-10-01', start_time: '09:00:00', end_time: '09:30:00', status: 'ASSIGNED', version: 1 },
      ],
    }).as('getMatrix');
    cy.intercept('GET', '/api/aides*', { body: [{ id: 1, name: 'John Smith' }, { id: 2, name: 'Mary Johnson' }] }).as('getAides');
    cy.intercept('PUT', '/api/assignments/10', { id: 10, task_id: 100, aide_id: 2, date: '2025-10-01', start_time: '09:00:00', end_time: '09:30:00', status: 'ASSIGNED', version: 2 }).as('updateAssignment');

    cy.visit('/');
    cy.wait('@getAides');
    cy.wait('@getMatrix');

    cy.get('[data-testid="assignment-card-10"]').drag('[data-testid="aide-col-2"]');
    cy.wait('@updateAssignment');

    // Click Undo then Redo
    cy.get('[data-testid="undo-btn"]').click();
    cy.get('[data-testid="redo-btn"]').click();
  });
});


