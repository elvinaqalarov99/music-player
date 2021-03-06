class Player {
  constructor(id, playlist, isMain = false) {
    this.isMain = isMain;
    this.playlist = playlist;
    this.id = id;
    this.podcastIndex = 0; // current podcast index
    this.currentPodcast = this.playlist[this.podcastIndex]; // current podcast data
    this.isPlaying = false;
    this.instance; // current podcast Howl intance;
    this.vol = 0.5; // current volume
    this.hash;
    // Bind Player class this to funtions to overwrite default this
    this.updateVolume = this.updateVolume.bind(this);
    this.setProgress = this.setProgress.bind(this);
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.state = true;

    // Player Buttons
    this.playBtn = document.querySelector(`#${this.id} #play`);
    this.prevBtn = document.querySelector(`#${this.id} #prev`);
    this.nextBtn = document.querySelector(`#${this.id} #next`);
    this.prev15Btn = document.querySelector(`#${this.id} #prev-15`);
    this.next15Btn = document.querySelector(`#${this.id} #next-15`);
    this.volume = document.querySelector(`#${this.id} #volume`);
    this.currentTime = document.querySelector(`#${this.id} #current-time`);
    this.durationTime = document.querySelector(`#${this.id} #duration-time`);
    this.podcastDate = document.querySelector(`#${this.id} #date`);
    this.podcastTitle = document.querySelector(`#${this.id} #title`);
    this.progressContainer = document.querySelector(
      `#${this.id} #progress-info`
    );
    this.progress = document.querySelector(`#${this.id} #progress`);

    this.removeListeners(); // remove all current listeners for further intialize
    this.addListeners(); // add listeners
    this.updatePodcastInfo(); // set first podcast instance
  }
}

Player.prototype.addListeners = function () {
  // Event Listeners
  this.prevBtn.addEventListener("click", this.prev);
  this.nextBtn.addEventListener("click", this.next);
  this.progressContainer.addEventListener("click", this.setProgress);
  this.prev15Btn.addEventListener("click", () =>
    this.setProgressTo15Secconds(-1)
  );
  this.next15Btn.addEventListener("click", () =>
    this.setProgressTo15Secconds(1)
  );
  this.playBtn.addEventListener("click", () => {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) this.playPodcast();
    else this.pausePodcast();
  });
  this.volume.addEventListener("change", this.updateVolume);
};

Player.prototype.removeListeners = function () {
  // Event Listeners
  this.prevBtn.removeEventListener("click", this.prev);
  this.nextBtn.removeEventListener("click", this.next);
  this.progressContainer.removeEventListener("click", this.setProgress);
  this.prev15Btn.removeEventListener("click", () =>
    this.setProgressTo15Secconds(-1)
  );
  this.next15Btn.removeEventListener("click", () =>
    this.setProgressTo15Secconds(1)
  );
  this.playBtn.removeEventListener("click", () => {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) this.playPodcast();
    else this.pausePodcast();
  });
  this.volume.removeEventListener("change", this.updateVolume);
};

Player.prototype.updatePodcastInfo = function () {
  this.currentPodcast = this.playlist[this.podcastIndex];
  this.instance = new Howl({
    src: this.currentPodcast.src,
    autoplay: false,
    html5: true,
    loop: false,
    preload: true,
    volume: this.vol,
    rate: 1,
    pool: 5,

    onload: () => {
      const { minutes, seconds } = this.getTime(this.instance.duration());

      this.durationTime.innerHTML = `${minutes}:${seconds}`;
      this.podcastTitle.innerHTML = this.currentPodcast.name;
      this.podcastDate.innerHTML = this.currentPodcast.date;

      this.hash = this.getHash();

      if (!window["activePlayers"].some((player) => player.id === this.id)) {
        window["activePlayers"].push({
          id: this.id,
          hash: this.hash,
          instance: this,
        });
      } else {
        window["activePlayers"] = window["activePlayers"].map((player) => {
          if (player.id == this.id && player.hash !== this.hash) {
            return { ...player, hash: this.hash };
          }

          return player;
        });
      }
    },

    onplay: () => {
      requestAnimationFrame(this.updateProgress.bind(this));

      // Last progress, check this out
      window["activePlayers"].forEach((player) => {
        const instance = player.instance;

        if (this.isMain) {
          if (!instance.isMain) instance.state = false;
          else instance.state = true;
        } else {
          if (instance.isMain) instance.state = false;
          else instance.state = true;
        }
      });

      if (this.isMain && this.state) this.checkAnotherPlayer(0);
      else if (!this.isMain && this.state) this.checkMainPlayer(0);
    },

    onpause: () => {
      if (this.isMain && this.state) this.checkAnotherPlayer(1);
      else if (!this.isMain && this.state) this.checkMainPlayer(1);
    },

    onseek: () => {
      if (!this.isPlaying) {
        this.playPodcast();
      }

      requestAnimationFrame(this.updateProgress.bind(this));

      if (this.isMain && this.state) this.checkAnotherPlayer(2);
      else if (!this.isMain && this.state) this.checkMainPlayer(2);
    },

    onend: () => {
      this.next();
    },
  });
};

Player.prototype.mute = function () {
  this.vol = 0;
  this.volume.value = 0;
  this.instance.volume(this.vol);
};

Player.prototype.seek = function (seek) {
  this.instance.seek(seek);
  this.updateProgress();
};

Player.prototype.playPodcast = function () {
  this.isPlaying = true;
  this.playBtn.querySelector("i").classList.replace("fa-play", "fa-pause");
  this.instance.play();
};

Player.prototype.pausePodcast = function () {
  this.isPlaying = false;
  this.playBtn.querySelector("i").classList.replace("fa-pause", "fa-play");
  this.instance.pause();
};

Player.prototype.changePodcast = function (callback) {
  this.isPlaying = true;
  this.clear();

  callback(); // manage prev and next podcasts

  this.instance.unload(); // Unload and destroy a Howl object
  this.updatePodcastInfo();
  this.playPodcast();
};

Player.prototype.updateProgress = function () {
  const width = (this.instance.seek() / this.instance.duration()) * 100;
  const { minutes, seconds } = this.getTime(this.instance.seek());

  this.currentTime.innerHTML = `${minutes}:${seconds}`;
  this.progress.style.width = `${width}%`;

  if (this.isPlaying) {
    requestAnimationFrame(this.updateProgress.bind(this));
  }
};

Player.prototype.prev = function () {
  this.changePodcast(() => {
    this.podcastIndex--;
    if (this.podcastIndex < 0) this.podcastIndex = this.playlist.length - 1;
  });
};

Player.prototype.next = function () {
  this.changePodcast(() => {
    this.podcastIndex++;
    if (this.podcastIndex > this.playlist.length - 1) this.podcastIndex = 0;
  });
};

Player.prototype.updateVolume = function (e) {
  this.vol = e.target.value;

  if (this.vol > 1) this.vol = 0;
  else if (this.vol < 0) this.vol = 1;

  this.instance.volume(this.vol);
};

Player.prototype.setProgress = function (e) {
  const width = this.progressContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = this.instance.duration();

  this.instance.seek((clickX / width) * duration);
  this.updateProgress();
};

Player.prototype.setProgressTo15Secconds = function (dir) {
  const seek = this.instance.seek();
  const duration = this.instance.duration();
  let newSeek = dir === 1 ? seek + 15 : seek - 15;

  if (newSeek >= duration) newSeek = duration;
  else if (newSeek <= 0) newSeek = 0;

  this.instance.seek(newSeek);
  this.updateProgress();
};

Player.prototype.getTime = function (value) {
  let minutes =
    Math.floor(value / 60) <= 9
      ? `0${Math.floor(value / 60)}`
      : Math.floor(value / 60);

  let seconds =
    Math.ceil(value % 60) <= 9
      ? `0${Math.ceil(value % 60)}`
      : Math.ceil(value % 60);

  if (seconds >= 60) {
    minutes = minutes <= 9 ? `0${+minutes + 1}` : +minutes + 1;
    seconds = "00";
  }

  return { minutes, seconds };
};

Player.prototype.getHash = function () {
  return (this.hash = md5(this.currentPodcast.src));
};

Player.prototype.clear = function () {
  this.progress.style.width = "0%";
  this.currentTime.innerHTML = "00:00";
};

Player.prototype.checkMainPlayer = function (action) {
  const player = mainPlayer;

  if (player.hash === this.hash) {
    this.mute();
    switch (action) {
      case 0: // play action
        setTimeout(() => player.seek(this.instance.seek()), 50); // wait 50  milliseconds to get main player seek position
        if (!player.isPlaying) player.playPodcast();
        break;

      case 1: // pause action
        player.pausePodcast();
        break;

      case 2: // seek action
        setTimeout(() => player.seek(this.instance.seek()), 50); // wait 50  milliseconds to get main player seek position
        if (!player.isPlaying) this.mute();
        break;
    }
  } else {
    player.pausePodcast();
  }
};

Player.prototype.checkAnotherPlayer = function (action) {
  console.log("checkAnotherPlayer");
  window["activePlayers"].forEach((player) => {
    if (player.id !== this.id) {
      const instance = player.instance;
      if (player.hash === this.hash) {
        switch (action) {
          case 0: // play action
            setTimeout(() => instance.seek(this.instance.seek()), 50); // wait 50  milliseconds to get main player seek position
            instance.playPodcast();
            instance.mute();
            break;
          case 1: // pause action
            instance.pausePodcast();
            break;
          case 2: // seek action
            setTimeout(() => instance.seek(this.instance.seek()), 50); // wait 50  milliseconds to get main player seek position
            instance.mute();
            break;
        }
      } else {
        instance.pausePodcast();
      }
    }
  });
};
