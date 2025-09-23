Changelog 2025.09.23. #1

I fixed the bug that threw me back to the login window (more specifically, I accidentally forgot to limit it to checking the token's validity only once, so it used to constantly check if it was valid).

I fixed the bug with the map, so now it renders less often, so in theory it won't lag, and it's important not to leave pop-ups open because that can cause lag too, but unfortunately I can't do anything about that because it's a bug in Leaflet

Changelog 2025.09.23. #2

I increased the speed so that you can test it in a maximum of 3 minute, but there may be a bug that prevents you from starting a new route immediately afterwards unless you refresh the page (I can't fix this, it works fine at normal speed).

Storage does not work directly because this is a focus-enhancing system. This way, you don't mess with it.
