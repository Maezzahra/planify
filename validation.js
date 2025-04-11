export const validateDescription = (description) =>
    description &&
    typeof description === "string" &&
    description.length >= 5 &&
    description.length <= 10;

// verifier si l'email est valide
export const isEmailValid = (email) =>
    email &&
    typeof email === "string" &&
    email.length >= 5 &&
    email.length <= 50 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// verifier si le password est valide
export const isPasswordValid = (password) =>
    password &&
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 16;