const { faker } = require("@faker-js/faker");

console.log("Testing faker randomization...");

// Generate 5 test employees
for (let i = 0; i < 5; i++) {
  const employee = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
  };
  console.log(`Employee ${i + 1}:`, employee);
}
