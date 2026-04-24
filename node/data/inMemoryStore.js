const { randomUUID } = require('crypto');

const tables = {
  users: [],
  documents: [],
  document_files: []
};

function nextId() {
  return randomUUID();
}

function nowTimestamp() {
  return new Date().toISOString();
}

function seedUsers() {
  if (tables.users.length > 0) return;

  tables.users.push(
    {
      id: nextId('users'),
      email: 'admin@example.com',
      password: 'hashed-password-placeholder',
      firstName: 'System',
      lastName: 'Admin',
      middleInitial: null,
      role: 'Admin',
      status: 'approved',
      isVerified: true,
      createdAt: nowTimestamp()
    },
    {
      id: nextId('users'),
      email: 'faculty@example.com',
      password: 'hashed-password-placeholder',
      firstName: 'Faculty',
      lastName: 'Member',
      middleInitial: null,
      role: 'Faculty Member',
      status: 'approved',
      isVerified: true,
      createdAt: nowTimestamp()
    }
  );
}

seedUsers();

module.exports = {
  tables,
  nextId,
  nowTimestamp
};
