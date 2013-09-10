### Requirements
* [gpio-admin](https://github.com/quick2wire/quick2wire-gpio-admin)

### Installation

* `sudo adduser $USER gpio`
* `sudo modprobe w1-gpio`
* `sudo modprobe w1-therm`

Log out and back in again.

### Tuning

#### ChowHound

http://chowhound.chow.com/topics/678636

If you want to try it manually, start by setting I=0 and D=0, then pick a value for P that is relatively high (100 or more for Celsius, or 180 for F). Observe how long it take to come up to temperature, and whether there is any overshoot. If there is significant overshoot (more than 2F), try increasing P by 50%, and try again, then back it back down as appropriate. Note that if you start with cold water, overshoot is more likely, so filling the tub with water that is close to the desired temp is easier.

Once you finally get it to the point where it is heating up "fast enough" and not overshooting "too much," you will probably find that it settled down to equilibrium at a little bit under the desired set point. Then it is time to start playing with the I value. Start high -- like I-500 (note that I=0 is effectively I = infinity), and then reduce it and see what happens. Eventually, it will progress from a steady-state undershoot to a long-term overshoot, and then you can zero in on perfection -- at least for that particular cooker.

The D value is of some value if you tend to start the water coming up to temp, e.g., by starting a timer while you are still at work, and then dropping a bunch of frozen food in the pot. Increasing the D value can reduce the time the bath requires to come back to steady-state, but I can also lead to overshoot, or even instability. A rough rule of thumb calls for D to be about 25% of the I value, but even that may be too much for your particular style of cooking. if you leave it at 0, life will go on.

Note that a little overshoot in the bath temperature may not be all that harmful, as the meat or whatever still has to come up to temperature internally. But if the meat is already thawed (close to room temperature), you don't want much of an overshoot.

#### Fresh Meal Solutions

http://freshmealssolutions.com/downloads/PID-tuning-guide_R2_V006.pdf
