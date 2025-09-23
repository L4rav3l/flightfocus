Changelog 2025.09.23.

I fixed the bug that threw me back to the login window (more specifically, I accidentally forgot to limit it to checking the token's validity only once, so it used to constantly check if it was valid).

I fixed the bug with the map, so now it renders less often, so in theory it won't lag, and it's important not to leave pop-ups open because that can cause lag too, but unfortunately I can't do anything about that because it's a bug in Leaflet
