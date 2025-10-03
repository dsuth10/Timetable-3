describe('Undo/Redo', () => {
  it('undos and redos a drag assignment', () => {
    // Provide initial weekly matrix with one assignment on aide 1
    cy.intercept('GET', '/api/assignments/weekly-matrix*', {
      assignments: [
        { id: 10, task_id: 100, aide_id: 1, date: '2025-10-01', start_time: '09:00', end_time: '09:30', status: 'ASSIGNED', version: 1 },
      ],
    }).as('getMatrix');

    // Aides list for columns
    cy.intercept('GET', '/api/aides*', { body: [{ id: 1, name: 'John Smith' }, { id: 2, name: 'Mary Johnson' }] }).as('getAides');

    // Stub updates for drag, undo, redo
    cy.intercept('PUT', '**/api/assignments/10', (req) => {
      const body = req.body || {};
      req.reply({
        statusCode: 200,
        body: {
          id: 10,
          task_id: 100,
          aide_id: body.aide_id ?? 1,
          date: '2025-10-01',
          start_time: '09:00',
          end_time: '09:30',
          status: 'ASSIGNED',
          version: Date.now(),
        },
      });
    }).as('updateAssignment');

    cy.visit('/');
    cy.wait('@getAides');
    cy.wait('@getMatrix');

    // Perform drag using plugin with force to ensure events fire in headless
    cy.get('[data-testid="assignment-card-10"]').scrollIntoView().should('exist');
    cy.get('[data-testid="assignment-card-10"]').drag('[data-testid="aide-col-2"]', { force: true });

    // Wait for update from drag
    cy.wait('@updateAssignment', { timeout: 10000 });

    // Undo then wait
    cy.get('[data-testid="undo-btn"]').should('not.be.disabled').click();
    cy.wait('@updateAssignment', { timeout: 10000 });

    // Redo then wait
    cy.get('[data-testid="redo-btn"]').should('not.be.disabled').click();
    cy.wait('@updateAssignment', { timeout: 10000 });
  });
});


