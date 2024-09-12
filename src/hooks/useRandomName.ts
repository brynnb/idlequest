//based on eqemu random name generator, not sure how much it matches original game
const useRandomName = () => {
  const generateRandomName = () => {
    const cons = "bcdfghjklmnpqrstvwxyz";
    const vows = "aeou";
    const allVows = "aeiou";
    const endPhon = ["a", "e", "i", "o", "u", "os", "as", "us", "is", "y", "an", "en", "in", "on", "un"];

    const lenDist = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    let newName = "";

    const firstChar =
      Math.random() < 0.5
        ? vows[Math.floor(Math.random() * vows.length)] +
          cons[Math.floor(Math.random() * cons.length)]
        : cons[Math.floor(Math.random() * cons.length)] +
          allVows[Math.floor(Math.random() * allVows.length)];

    newName += firstChar.charAt(0).toUpperCase() + firstChar.slice(1);

    for (let len = firstChar.length; len < lenDist - 1; len++) {
        
      newName +=
        len % 2 === 0
          ? cons[Math.floor(Math.random() * cons.length)]
          : allVows[Math.floor(Math.random() * allVows.length)];
    }

    newName += endPhon[Math.floor(Math.random() * endPhon.length)];

    return newName;
  };

  return { generateRandomName };
};

export default useRandomName;
