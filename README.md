# Public pool temperature

Displays only sensor.pool_display_temperature and a timestamp. No HA login or HA token is exposed.

## Enable the website
In Settings → Pages, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and Save.
Expected URL: https://9dcb7zk84d-cell.github.io/pool/

The page reads public data.json from the main branch once per minute, avoiding Pages deployment delay for sensor updates. It marks readings stale after 25 minutes.

## Home Assistant OS / Container setup
1. Copy home-assistant/pool_publish.py to /config/pool_publish.py.
2. Create a fine-grained GitHub personal access token restricted to this pool repository, with Contents: Read and write. Set an expiry and renew before it expires. Keep the token private.
3. Save just the token in /config/pool_github_token using your HA file editor. Do not put it in this repository. The token gives write access to this repository only.
4. Copy home-assistant/pool_public.yaml to /config/packages/pool_public.yaml. Enable packages by merging this into your existing homeassistant section (do not duplicate existing keys):
   
   homeassistant:
     packages: !include_dir_named packages

   Alternatively merge shell_command and automation sections into your existing configuration; preserve existing automations.
5. Check configuration and restart Home Assistant. In Developer Tools → Actions, run shell_command.publish_pool_temperature to verify the first update.

The automation publishes every 10 minutes and at HA startup. Invalid sensor readings publish as unavailable. If HA stops, the website retains the last reading and marks it stale. Publish time is the time HA sent the sensor's current state; it does not establish when the physical sensor last measured the water.

Python uses only the standard library. This configuration requires Python 3 in the HA runtime (included in HA OS/Container). No inbound access to HA is required.

