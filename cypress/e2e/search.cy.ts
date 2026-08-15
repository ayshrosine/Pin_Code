describe("Bangalore Pincode Explorer - Search Flow & Error Handling", () => {
  it("1. Visit homepage, type 'Koramangala' in area search, and assert 560034 appears", () => {
    cy.visit("/");

    // Type "Koramangala" in area search input
    cy.get("input#pincode-search-input")
      .should("be.visible")
      .clear()
      .type("Koramangala");

    // Assert pincode 560034 and Koramangala area name appear
    cy.contains("560034", { timeout: 8000 }).should("be.visible");
    cy.contains("Koramangala").should("be.visible");
  });

  it("2. Toggle to Pincode mode, type invalid pincode '123', and assert error message is displayed", () => {
    cy.visit("/");

    // Toggle mode to Pincode
    cy.contains("button", "Pincode").click();

    // Type invalid pincode "123"
    cy.get("input#pincode-search-input")
      .should("be.visible")
      .clear()
      .type("123");

    // Assert error state is displayed
    cy.contains("Invalid Pincode Format", { timeout: 8000 }).should("be.visible");
  });
});
