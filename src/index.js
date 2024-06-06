// Selectors and classnames
const TITLE_CLASS = "title ytmusic-player-bar"; // Class for the song title
const SUBTITLE_CLASS = "subtitle style-scope ytmusic-player-bar"; // Class for the artist name
const TAB_HEADER_CLASS = "tab-header style-scope ytmusic-player-page"; // Class for the tab headers
const TAB_CONTENT_CLASS = "tab-content style-scope tp-yt-paper-tab"; // Class for the tab content
const LYRICS_CLASS = "lyrics"; // Class for the lyrics container
const DESCRIPTION_CLASS =
  "description style-scope ytmusic-description-shelf-renderer"; // Class for the description container
const FOOTER_CLASS = "footer style-scope ytmusic-description-shelf-renderer"; // Class for the footer
const TIME_INFO_CLASS = "time-info style-scope ytmusic-player-bar"; // Class for the time info
const SONG_IMAGE_SELECTOR = "#song-image>#thumbnail>#img"; // Selector for the song image

// Constants
const LYRICS_API_URL = "https://lyrics-api.boidu.dev/getLyrics"; // URL for the lyrics API
const FONT_LINK = "https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap"; // URL for the font

// Console log constants

const LOG_PREFIX = "[BetterLyrics]";
const IGNORE_PREFIX = "(Safe to ignore)";
const FETCH_LYRICS_LOG = `${LOG_PREFIX} Attempting to fetch lyrics for`;
const SERVER_ERROR_LOG = `${LOG_PREFIX} Unable to fetch lyrics due to server error`;
const NO_LYRICS_FOUND_LOG = `${LOG_PREFIX} No lyrics found for the current song`;
const LYRICS_FOUND_LOG = `${LOG_PREFIX} Lyrics found, injecting into the page`;
const LYRICS_TAB_HIDDEN_LOG = `${LOG_PREFIX} ${IGNORE_PREFIX} Lyrics tab is hidden, skipping lyrics fetch`;
const LYRICS_TAB_VISIBLE_LOG = `${LOG_PREFIX} Lyrics tab is visible, fetching lyrics`;
const LYRICS_TAB_CLICKED_LOG = `${LOG_PREFIX} Lyrics tab clicked, fetching lyrics`;
const LYRICS_WRAPPER_NOT_VISIBLE_LOG = `${LOG_PREFIX} ${IGNORE_PREFIX} Lyrics wrapper is not visible, unable to inject lyrics`;
const FOOTER_NOT_VISIBLE_LOG = `${LOG_PREFIX} ${IGNORE_PREFIX} Footer is not visible, unable to inject source link`;
const LYRICS_TAB_NOT_DISABLED_LOG = `${LOG_PREFIX} ${IGNORE_PREFIX} Lyrics tab is not disabled, unable to enable it`;
const SONG_SWITCHED_LOG = `${LOG_PREFIX} Song has been switched`;
const ALBUM_ART_ADDED_LOG = `${LOG_PREFIX} Album art added to the layout`;
const GENERAL_ERROR_LOG = `${LOG_PREFIX} Error:`;

// Helper function to convert time string to integer
const timeToInt = (time) => {
  time = time.split(":");
  time = parseFloat(time[0]) * 60 + parseFloat(time[1]);
  return time;
};

// Function to create and inject lyrics
const createLyrics = () => {
  const song = document.getElementsByClassName(TITLE_CLASS)[0].innerHTML; // Get the song title
  let artist;
  try {
    artist =
      document.getElementsByClassName(SUBTITLE_CLASS)[0].children[0].children[0]
        .innerHTML; // Get the artist name
  } catch (err) {
    artist =
      document.getElementsByClassName(SUBTITLE_CLASS)[0].children[0].innerHTML; // Get the artist name (alternative way)
  }
  console.log(FETCH_LYRICS_LOG, song, artist); // Log fetching lyrics

  const url = `${LYRICS_API_URL}?s=${song}&a=${artist}`; // Construct the API URL with song and artist

  fetch(url)
    .then((response) => response.json())
    .catch((err) => {
      console.log(SERVER_ERROR_LOG); // Log server error
      console.log(err);
      return;
    })
    .then((data) => {
      const lyrics = data.lyrics;
      clearInterval(window.lyricsCheckInterval); // Clear the lyrics interval

      if (lyrics === undefined || lyrics.length === 0) {
        console.log(NO_LYRICS_FOUND_LOG); // Log no lyrics found

        try {
          const lyricsContainer =
            document.getElementsByClassName(LYRICS_CLASS)[0];
          lyricsContainer.innerHTML = ""; // Clear the lyrics container
          const errorContainer = document.createElement("div");
          errorContainer.className = "blyrics-error";
          errorContainer.innerHTML = "No lyrics found for this song.";
          lyricsContainer.appendChild(errorContainer); // Append error message to lyrics container
        } catch (err) {
          console.log(LYRICS_WRAPPER_NOT_VISIBLE_LOG); // Log lyrics wrapper not visible
        }

        return;
      }
      console.log(LYRICS_FOUND_LOG); // Log lyrics found
      let wrapper = null;
      try {
        const tabSelector =
          document.getElementsByClassName(TAB_HEADER_CLASS)[1];
        tabSelector.removeAttribute("disabled");
        tabSelector.setAttribute("aria-disabled", "false"); // Enable the lyrics tab
        wrapper = document.querySelector(
          "#tab-renderer > ytmusic-message-renderer"
        );
        const lyrics = document.getElementsByClassName(LYRICS_CLASS)[0];
        lyrics.innerHTML = ""; // Clear the lyrics container
      } catch (err) {
        console.log(LYRICS_TAB_NOT_DISABLED_LOG); // Log lyrics tab not disabled
      }
      injectLyrics(lyrics, wrapper); // Inject lyrics
    });
};

// Function to inject lyrics into the DOM
const injectLyrics = (lyrics, wrapper) => {
  // Inject Lyrics into DOM
  let lyricsWrapper;
  if (wrapper !== null) {
    lyricsWrapper = wrapper;
  } else {
    lyricsWrapper = document.getElementsByClassName(DESCRIPTION_CLASS)[1]; // Get the lyrics wrapper
  }

  try {
    const footer = (document.getElementsByClassName(
      FOOTER_CLASS
    )[0].innerHTML = `Source: <a href="https://boidu.dev" class="footer-link" target="_blank">boidu.dev</a>`); // Set the footer content
    footer.removeAttribute("is-empty");
  } catch (err) {
    console.log(FOOTER_NOT_VISIBLE_LOG); // Log footer not visible
  }

  try {
    lyricsWrapper.innerHTML = "";
    const lyricsContainer = document.createElement("div");
    lyricsContainer.className = LYRICS_CLASS;
    lyricsWrapper.appendChild(lyricsContainer); // Append the lyrics container to the wrapper

    lyricsWrapper.removeAttribute("is-empty");
  } catch (err) {
    console.log(LYRICS_WRAPPER_NOT_VISIBLE_LOG); // Log lyrics wrapper not visible
  }

  lyrics.forEach((item) => {
    let line = document.createElement("div");
    line.dataset.time = item.startTimeMs / 1000; // Set the start time of the line
    line.setAttribute("data-scrolled", false);

    line.setAttribute(
      "onClick",
      `const player = document.getElementById("movie_player"); player.seekTo(${
        item.startTimeMs / 1000
      }, true);player.playVideo();` // Set the onClick event to seek to the start time and play the video
    );

    line.innerHTML = item.words; // Set the line text

    try {
      document.getElementsByClassName(LYRICS_CLASS)[0].appendChild(line); // Append the line to the lyrics container
    } catch (err) {
      console.log(LYRICS_WRAPPER_NOT_VISIBLE_LOG); // Log lyrics wrapper not visible
    }
  });

  // Set an interval to sync the lyrics with the video playback
  window.lyricsCheckInterval = setInterval(function () {
    try {
      let currentTime =
        timeToInt(
          document
            .getElementsByClassName(TIME_INFO_CLASS)[0]
            .innerHTML.replaceAll(" ", "")
            .replaceAll("\n", "")
            .split("/")[0]
        ) + 0.75; // Get the current time of the video
      const lyrics = [
        ...document.getElementsByClassName(LYRICS_CLASS)[0].children,
      ]; // Get all the lyrics lines

      lyrics.every((elem, index) => {
        const time = parseFloat(elem.getAttribute("data-time")); // Get the start time of the line
        if (currentTime >= time && index + 1 === lyrics.length) {
          // If it's the last line
          elem.setAttribute("class", "current"); // Set it as the current line
          const current = document.getElementsByClassName("current");
          current[0].scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          }); // Scroll to the current line
          return true;
        } else if (
          currentTime > time &&
          currentTime < parseFloat(lyrics[index + 1].getAttribute("data-time"))
        ) {
          // If it's between the current and next line
          const current = document.getElementsByClassName("current")[0];

          elem.setAttribute("class", "current"); // Set it as the current line
          if (
            current !== undefined &&
            current.getAttribute("data-scrolled") !== "true"
          ) {
            current.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            }); // Scroll to the current line
            current.setAttribute("data-scrolled", true); // Mark as scrolled
          }
          return true;
        } else {
          elem.setAttribute("data-scrolled", false); // Reset the scrolled flag
          elem.setAttribute("class", ""); // Remove the current class
          return true;
        }
      });
    } catch (err) {
      console.log(err);
      return true;
    }
  }, 50); // Check every 50ms
};

// Function to add the album art to the layout
const addAlbumArtToLayout = () => {
  const albumArt = document.querySelector(SONG_IMAGE_SELECTOR).src; // Get the album art URL
  document.getElementById(
    "layout"
  ).style = `--blyrics-background-img: url('${albumArt}')`; // Set the background image of the layout

  console.log(ALBUM_ART_ADDED_LOG); // Log album art added
};

// Main function to modify the page
const modify = () => {
  const fontLink = document.createElement("link");
  fontLink.href = FONT_LINK;
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink); // Add the font link to the head

  // Detect Song Changes
  let song = {
    title: "",
    artist: "",
  };
  let targetNode = document.getElementsByClassName(TITLE_CLASS)[0]; // Get the song title element
  let config = {
    attributes: true,
    childList: true,
  };

  let callback = function (mutationsList) {
    for (let mutation of mutationsList) {
      if (mutation.type == "attributes") {
        // SONG TITLE UPDATED
        if (
          song.title !== targetNode.innerHTML &&
          !targetNode.innerHTML.startsWith("<!--") &&
          targetNode.innerHTML !== ""
        ) {
          console.log(SONG_SWITCHED_LOG, targetNode.innerHTML); // Log song switch
          song.title = targetNode.innerHTML;
          addAlbumArtToLayout(); // Add the album art to the layout

          // Check if lyrics tab is visible
          const tabSelector =
            document.getElementsByClassName(TAB_HEADER_CLASS)[1];
          if (tabSelector.getAttribute("aria-selected") === "true") {
            console.log(LYRICS_TAB_VISIBLE_LOG); // Log lyrics tab visible
            setTimeout(() => createLyrics(), 1000); // Fetch lyrics after a short delay
          } else {
            console.log(LYRICS_TAB_HIDDEN_LOG); // Log lyrics tab hidden
          }
        }
      }
    }
  };

  let observer = new MutationObserver(callback);
  observer.observe(targetNode, config); // Observe the song title element for changes

  // Fetch Lyrics once the lyrics tab is clicked
  function lyricReloader() {
    const tabs = document.getElementsByClassName(TAB_CONTENT_CLASS);

    const [tab1, tab2, tab3] = tabs;

    if (tab1 !== undefined && tab2 !== undefined && tab3 !== undefined) {
      tab2.addEventListener("click", function () {
        console.log(LYRICS_TAB_CLICKED_LOG); // Log lyrics tab clicked
        setTimeout(() => createLyrics(), 1000); // Fetch lyrics after a short delay
      });
    } else {
      setTimeout(() => lyricReloader(), 1000); // Try again after a delay if the tabs aren't loaded yet
    }
  }
  lyricReloader();
};

try {
  if (document.readyState !== "loading") {
    modify(); // Call the modify function if the page is already loaded
  } else {
    document.addEventListener("DOMContentLoaded", modify); // Call the modify function when the page is loaded
  }
} catch (err) {
  console.log(GENERAL_ERROR_LOG, err); // Log any errors
}
