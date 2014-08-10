SWIC
====

Small WebInterface for cec-client based on Node.js
(Currently tested and working on Raspberry Pi (raspbmc))

![Example](https://github.com/jingx23/SWIC/raw/master/common/images/screen1.png "Example")

Setup
-----
1. Install cec-client [more information](https://github.com/Pulse-Eight/libcec)
2. Configurate your hdmi-server.js
  * host
  * port
  * USER_DEFINED_HDMI_PORTS => this array is optional, normally hdmi-server scans the hdmi bus to find all hdmi ports. In some case some ports wouldn´t be
    found so you can add them here.
3. Fire node hdmi-server.js (Be patient on first call it takes some time because of scanning and caching hdmi ports)

optional autostart setup:
1. Edit init.d/swic
2. copy init.d/swic to /etc/init.d/swic
3. update-rc.d swic defaults

Additions
---------
You can force rescan of the hdmi bus simple call http://127.0.0.1:8088/?cmd=list&force=true it takes some time for cec-client to scan and build the cache file.