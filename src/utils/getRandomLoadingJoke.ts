export class LoadingJokeUtil {
  private static jokes: string[] = [
    "Attaching beards to dwarves",
    "Does anybody actually read this?",
    "Dusting off spell books",
    "Have you hugged an Iskar today?",
    "Looking for graphics <LFG>",
    "Now spawning Fippy_Darkpaw_432,326,312",
    "Teaching snakes to kick",
    "You have got better at Loading (6)!",
    "Adding vanilla flavor to ice giants",
    "Aradune Is Still Stinky",
    "Banging on the keyboard will not make this go any faster",
    "Creating randomly generated feature",
    "Darkening Dark Elves",
    "Doing things you don't want to know about",
    "Ensuring Gnomes are Still Short",
    "Entering randomly mispeled words",
    "Feeding the bears",
    "Filling halflings with pie",
    "Have you tried batwing crunchie cereal?",
    "Hiding cat-nip from the Vah Shir",
    "Loading, don't wait if you don't want to",
    "Look out behind you",
    "Looking up Barbarian Kilts",
    "Making Barbarians tall",
    "Making Gnomes short",
    "Making sure everything works Perfektly",
    "Polishing Erudite Foreheads",
    "Preparing to spin you around rapidly",
    "Random nerfing of SOW",
    "Reloading Death Touch Ammunition!",
    "Sanding wood elves, now 45% smoother",
    "Stupidificationing Ogres",
    "Sharpening Claws",
    "Starching high elf robes",
    "Told You It Wasn't Made of Cheeze",
    "Warning, Half Elves are now only .49999 elves",
    "Whacking trolls with ugly stick"
  ];

  public static getRandomLoadingJoke(): string {
    const randomIndex = Math.floor(Math.random() * this.jokes.length);
    return this.jokes[randomIndex];
  }
}
