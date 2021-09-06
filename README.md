# Ghostbook

## Description

Simple utility for Phasmophobia, to facilitate finding ghosts by the means of compatible clues.

## Usage

Hosted as a GitHub Page at https://smmilut.github.io/ghostbook/

## Development and contributions

The goal is to have something simple for me to create and maintain if I absolutely have to. I need code that is minimal and explicit, and easy to develop and maintain. I am not using complex tools, a build process, dependencies, or anything other than plain Javascript. I also don't intend to support crazy browser configurations, or prevent users from creating errors on every edge case.

If you would like to contribute a new language for the ghost descriptions, feel free to submit a PR with the modified `monsters.json` for your language. You can take the current file as an example because you can see how `en` and `fr` languages are supported. If I do get a PR for a language, then I will make necessary code modifications to support it (not currently supported by default), but feel free to propose one as well.

## Privacy

The page contains no trackers or analytics, and uses no cookies. It works fully locally and doesn't even require internet access.

Code is easy to introspect because it is not minified or obscured (though badly written probably). The scripts are simple and use no external dependencies (except style sheet `sanitize.css` which is only for visuals).

## License

The Phasmophobia branding and game data belong to their respective owners, I do not claim ownership on them. This project is not affiliated with Phasmophobia.

The code in this project is licensed under the MIT license as described in the `LICENSE` file.

The assets of this project are licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/) attributed to Pil Smmilut, except if otherwise specified.
