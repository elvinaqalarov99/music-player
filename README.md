# music-player

# Usage

To use the player as main and secondary some aspects should be considered:

1. All players should have unique identifier
2. Main player should be instantiated as main (passing true as 3rd parameter):
   const mainPlayer = new Player("main-howl-container", mainPodcasts, true);
3. Podcasts' playlist should have strtucture: {id: 1, name: "Name of the podcast", date: "DD.MM.YYYY", src: "source or url"}
