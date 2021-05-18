(function() {

    /* 
    *  Date.tz(timestamp, timezone) 
    *  Date with timezone constructor 
    *  timestamp: Compatible date object, string, or milliseconds since 1970. Default is now
    *  timezone: Timezone to be used for formatting and comparison operations. Defaults is globalThis.timezone or the local default
    *
    *  Example: 
    *  Date.tz('2021-05-16T20:01:00-05:00', 'US/Pacific') // 2021-05-16T18:01:00-07:00
    *  Date.tz(1615712400000, 'US/Pacific')               //2021-03-14T01:00:00-08:00
    *  Date.tz()                                          //local time and zone 2021-05-17T16:55:10-07:00
    */
    Date.tz = function(timestamp, timezone) {

        //only timezone passed in
        if(timestamp && !timezone && Number.isNaN(new Date(timestamp).valueOf())) { 
            timezone = timestamp;
            timestamp = undefined;
        }

        let now = timestamp ? new Date(timestamp) : new Date();
        now.timezone = timezone || globalThis.timezone;

        return now;
    }

    //holds the timezone setting 
    if(!Date.timezone) { 
        Object.defineProperty(Date, 'timezone', { value: undefined, writable: true });
    }
    
    //utility function to clone a date object
    if(!Date.prototype.copy && Date.tz) {
        Date.prototype.copy = function() { return Date.tz(this, this.timezone); }
    }

    /* 
    * function getParts()
    * returns object of date components in string representation
    * timezone used is the one passed into Date.tz constructor, globalThis.timezone, or the local default
    */
    Date.prototype.getParts = function() {
        this.timezone = this.timezone || globalThis.timezone;
        
        let dateParts = {};

        //get the date parts
        new Intl.DateTimeFormat('en-GB', { weekday: 'long',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: this.timezone, timeZoneName: 'short', hourCycle: 'h23'
        }).formatToParts(this).reduce(function(acc, p) { 
            if(p.type !== 'literal') { 
                acc[p.type] = p.value; 
            } 
            return acc; 
        }, dateParts);

        //add in the full month name
        new Intl.DateTimeFormat('en-GB', { timeZone: this.timezone, month: 'long' }).formatToParts(this).reduce(function(acc, p) { 
            acc.monthLong = p.value; 
        }, dateParts);

        return dateParts;
    }

    /*
    *  Function format([format string])
    *  Returns string output based on formatter string
    *  Default is YYYY-MM-DDTHH:MM:SS-HH:MM
    *  Options: 
    *  YYYY - Full year
    *  YY   - 2-digit year
    *  MMMM - Month (full)
    *  MMM  - Month (abv)
    *  MM   - Month 2-digit
    *  M    - Month 
    *  dddd - Weekday (full)
    *  ddd  - Weekday (abv)
    *  DD   - 2 digit date
    *  D    - date
    *  HH   - hour (24h) 2-digit 
    *  H    - hour (24h)
    *  hh   - hour (12h) 2-digit
    *  h    - hour (12h)
    *  mm   - minute 2-digit
    *  m    - minute
    *  ss   - second 2-digit
    *  s    - second
    *  aa   - day period (am or pm)
    *  a    - day period (a or p)
    */
    Date.prototype.format = function(display) {

        let dateParts = this.getParts();

        if(!display) {
            return dateParts.year + '-' + dateParts.month + '-' + dateParts.day +
            'T' + dateParts.hour + ':' + dateParts.minute + ':' + dateParts.second + 
            (dateParts.timeZoneName == 'UTC' ? 'Z' : (dateParts.timeZoneName.substr(3,1) + (dateParts.timeZoneName.substr(4).padStart(2,'0').padEnd(4,'0')).match(/\d{2,2}/g).join(':')));
        }

        display = display.replace(/YYYY/g, dateParts.year)
                .replace(/YY/g, dateParts.year.substr(2))
                .replace(/DD/g, dateParts.day)
                .replace(/D/g, +dateParts.day)
                .replace(/HH/g, dateParts.hour)
                .replace(/H/g, +dateParts.hour)
                .replace(/mm/g, dateParts.minute)
                .replace(/m/g, +dateParts.minute)
                .replace(/hh/g, (+dateParts.hour % 12).toString().padStart(2,'0'))
                .replace(/h/g, +dateParts.hour % 12)
                .replace(/ss/g, dateParts.second)
                .replace(/s/g, +dateParts.second)
                .replace(/aa/g, +dateParts.hour < 12 ? 'am' : 'pm')
                .replace(/a/g, +dateParts.hour < 12 ? 'a' : 'p')
                .replace(/MMMM/g, dateParts.monthLong)
                .replace(/MMM/g, dateParts.monthLong.substr(0,3))
                .replace(/MM/g, dateParts.month)
                .replace(/M(?![a-zA-Z])/g, +dateParts.month)
                .replace(/dddd/g, dateParts.weekday)
                .replace(/ddd/g, dateParts.weekday.substr(0,3));

        return display;
    }

    //get or set the 4 digit year
    Date.prototype.year =
    Date.prototype.years = function(val) {
        let y = Number.parseInt(this.getParts().year);
        if(val === undefined) {
            return y;
        }
        return this.add(val - y, 'years');
    }

    //gets or set the month [0 - 11]
    Date.prototype.month =
    Date.prototype.months = function(val) {
        let m = +this.getParts().month - 1;
        if(val === undefined) {
            return m;
        }
        if(val < 0 || val > 11) {
            return this;
        }

        return this.add(val - m, 'months');
    }

    //gets the week of the year [1 - 52]
    Date.prototype.week = function() {
        var temp = Date.tz(this.valueOf(), this.timezone);
        temp.month(0).date(0).hours(0).minutes(0).seconds(0);
        var day = temp.day();
        var wk = 0;

        var ms = this.valueOf() - temp.valueOf();
        if(day > 0) {
            ms -= (day * 86400000);
            wk++;
        }
        wk += Math.round(ms/604800000);

        return wk;
    }

    //get the day of the year
    Date.prototype.dayOfYear = function() {
        var temp = Date.tz(this.valueOf(), this.timezone);
        temp.month(0).date(0).hours(0).minutes(0).seconds(0);

        var ms = this.valueOf() - temp.valueOf();
        return Math.floor(ms/86400000);
    }

    //get or set the day of the month
    Date.prototype.date = function(val) {
        let d = Number.parseInt(this.getParts().day);
        if(val === undefined) {
            return d;
        }
        return this.add(val - d, 'days');
    }

    //returns the numeric day of the week [0-6]
    Date.prototype.day = function() {
        return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(this.getParts().weekday);
    }

    //gets or sets the hour [0 - 23]
    Date.prototype.hour = 
    Date.prototype.hours = function(val) {
        let h = Number.parseInt(this.getParts().hour);

        if(val === undefined) {
            return h;
        }

        //adjust of local offset - only applies to setting the hour
        return this.add(val - h, 'hours');
    }

    //gets or sets the minute [0 - 59]
    Date.prototype.minute = 
    Date.prototype.minutes = function(val) {
        if(val === undefined) {
            return this.getMinutes();
        }

        this.setMinutes(val);
        return this;
    }

    //gets or sets the second [0 - 59]
    Date.prototype.second = 
    Date.prototype.seconds = function(val) {
        if(val === undefined) {
            return this.getSeconds();
        }
        this.setSeconds(val);
        return this;
    }

    //gets or sets the millisecond [0 - 999]
    Date.prototype.ms = 
    Date.prototype.millisecond = 
    Date.prototype.milliseconds = function(val) {
        if(val === undefined) {
            return this.getMilliseconds();
        }
        this.setMilliseconds(val);
        return this;
    }

    //utility function to set the time to the beginning of a day 00:00:00
    Date.prototype.resetDay = function() {
        this.hours(0).minutes(0).seconds(0).milliseconds(0);

        return this;
    }

    /* 
    * Function add([count, unit])
    * Modifies the current datetime object
    * count: numeric amount to adjust. positive or negative value (required)
    * unit:  string to specify period (required)
    *
    * unit options:
    * ms/millisecond(s)
    * second(s) 
    * minute(s)
    * hour(s)
    * day(s)
    * week(s)
    * month(s)
    * year(s)
    * 
    * value may be positive or negative and may be outside of the normal get/set range
    * example:
    * (100, 'seconds')
    * (-10, 'minutes')
    * (10, 'months')
    * (1, 'day')
    */
    Date.prototype.add = function(count, unit) {
        
        //get first three letters of unit
        unit = unit.toLowerCase().trim().substr(0,3);

        count = Math.round(count) || 0;

        if(unit === 'ms' || unit === 'mil') {
            this.setTime(this.valueOf() + count);
        } else if(unit === 'sec') {
            this.setTime(this.valueOf() + (count * 1000));
        } else if(unit === 'min') {
            this.setTime(this.valueOf() + (count * 60 * 1000));
        } else if(unit === 'hou') {
            this.setTime(this.valueOf() + (count * 3600 * 1000));
        } else if(unit === 'wee') {
            this.setTime(this.valueOf() + (count * 604800 * 1000));
        } else if(['yea', 'mon', 'day'].indexOf(unit) > -1) {
            
            let tzOffset = new Intl.DateTimeFormat('en-GB', { timeZone: this.timezone, timeStyle: 'long' }).formatToParts(this).reduce(function(val, f) { return f.type == 'timeZoneName' ? Number.parseInt(f.value.substr(3)) : 0; });
            let offset = new Intl.DateTimeFormat('en-GB', { timeStyle: 'long' }).formatToParts(this).reduce(function(val, f) { return f.type == 'timeZoneName' ? Number.parseInt(f.value.substr(3)) : 0; });

            let localOffset = (offset || 0) - (tzOffset || 0);
        

            //adjust time to match timezone before applying changes
            this.setTime(this.valueOf() - (localOffset * 3600000));

            if(unit === 'day') {
                this.setDate(this.getDate() + count);
            } else if(unit === 'mon') {
                this.setMonth(this.getMonth() + count);
            } else if(unit === 'yea') {
                this.setFullYear(this.getFullYear() + count);
            }

            //adjust time back after applying changes
            this.setTime(this.valueOf() + (localOffset * 3600000));                
        }

        return this;
    }

    //convenience function to call add with a negative value
    Date.prototype.subtract = function(count, unit) {
        return this.add(count * -1, unit);
    }

    /*
    *  Date.duration(t1, t2)
    *  Static function to calculate the time between two dates
    *  returns an object with utility functions to format the value
    *  t1:  Date object or quantity 
    *  t2:  Date object or string unit
    *  if t1 is a date object and t2 is not supplied, now is used for t2
    *  
    *  functions: 
    *  asSeconds(), asMinutes(), asHours(), asDays(), asWeeks, asMonths, asYears
    *  humanize(), humanizeAbv()

    * examples:  
    * Date.duration(Date.tz('2020-01-01T00:00:00Z')).asDays()     // 502 days from now (5/16/2021)
    * Date.duration(20, 'hours').asMinutes()                      // 1200 
    * Date.duration(Date.tz().subtract(43, 'days')).asWeeks()     // 6
    * Date.duration(Date.tz().subtract(43, 'days')).humanize()    // 1 month
    * Date.duration(Date.tz().subtract(43, 'days')).humanizeAbv() // 1 mo
    */
    Date.duration = function(t1, t2) {
        if(!t1) {
            return;
        }

        var ms = 0;
        if(typeof t1 === 'number') {
            ms = Math.abs(t1);
        } else if(t1.valueOf) {
            
            ms = t1.valueOf();
            //subtract from now if not a second date
            if(ms > 10000000000 && !t2) {
                t2 = new Date().valueOf();
            }
        }
        if(t2) {
            if(typeof t2 === 'string') {
                if(t2 === 'minutes') {
                    ms *= 60000;
                } else if(t2 === 'hours') {
                    ms *= 3600000;
                } else if(t2 === 'days') {
                    ms *= 86400000;
                } else if(t2 === 'weeks') {
                    ms *= 604800000;
                } else if(t2 === 'months') {
                    ms *= 2592000000;
                } else if(t2 === 'years') {
                    ms *= 31536000000;
                } else {
                    return; 
                }
            } else if(typeof t2 === 'number') {
                ms = Math.abs(t2 - ms);
            } else if(t2.valueOf) {
                ms = Math.abs(t2.valueOf() - ms);
            }
        }

        var obj = {
            ms: ms,

            asSeconds: function() {
                return Math.floor(this.ms/1000);
            },
            seconds: function() { return this.asSeconds(); },

            asMinutes: function() {
                return Math.floor(this.ms/60000);
            },
            minutes: function() {  return this.asMinutes(); },

            asHours: function() {
                return Math.floor(this.ms/3600000);
            },
            minutes: function() {  return this.asMinutes(); },

            asDays: function() {
                return Math.floor(this.ms/86400000);
            }, 
            days: function() {  return this.asDays(); },

            asWeeks: function() {
                return Math.floor(this.ms/604800000);
            }, 
            weeks: function() {  return this.asWeeks(); },

            asMonths: function() {
                return Math.floor(this.ms/2592000000);
            },
            months: function() {  return this.asMonths(); },

            asYears: function() {
                return Math.floor(this.ms/31536000000);
            },
            years: function() {  return this.asYears(); },
            
            humanize: function() {
                var val = '';

                if(this.asYears()) {
                    return this.asYears() + ' year' + (this.asYears() > 1 ? 's' : '');
                } 
                if(this.asMonths()) {
                    return this.asMonths() + ' month' + (this.asMonths() > 1 ? 's' : '');
                }
                if(this.asWeeks()) {
                    return this.asWeeks() + ' week' + (this.asWeeks() > 1 ? 's' : '');
                }
                if(this.asDays()) {
                    return this.asDays() + ' day' + (this.asDays() > 1 ? 's' : '');
                }
                if(this.asHours()) {
                    return this.asHours() + ' hour' + (this.asHours() > 1 ? 's' : '');
                }
                if(this.asMinutes()) {
                    return this.asMinutes() + ' minute' + (this.asMinutes() > 1 ? 's' : '');
                }
                if(this.asSeconds()) {
                    return this.asSeconds() + ' second' + (this.asSeconds() > 1 ? 's' : '');
                }

                return 'now';
            },

            humanizeAbv: function(minRes, padding) {
                minRes = minRes || 's';
                padding = isNaN(+padding) ? 1 : +padding;

                var val = '';

                if(this.asYears() || minRes === 'y') {
                    return this.asYears() + 'y'.padStart(padding + 1, ' ');
                } 
                if(this.asMonths() || minRes === 'mo') {
                    return this.asMonths() + 'mo'.padStart(padding + 2, ' ');
                }
                if(this.asWeeks() || minRes === 'w') {
                    return this.asWeeks() + 'w'.padStart(padding + 1, ' ');
                }
                if(this.asDays() || minRes === 'd') {
                    return this.asDays() + 'd'.padStart(padding + 1, ' ');
                }
                if(this.asHours() || minRes === 'h') {
                    return this.asHours() + 'h'.padStart(padding + 1, ' ');
                }
                if(this.asMinutes() || minRes === 'm') {
                    return this.asMinutes() + 'm'.padStart(padding + 1, ' ');
                }
                if(this.asSeconds()) {
                    return this.asSeconds() + 's'.padStart(padding + 1, ' ');
                }

                return 'now';
            }, 
            
            format: function() {
                return this.asDays() + 'd ' + (this.asHours() % 24).toString().padStart(2,'0') + 'h ' + (this.asMinutes() % 60).toString().padStart(2,'0') + 'm ' + (this.asSeconds() % 60).toString().padStart(2,'0') + 's';
            }
        }

        return obj;
    }

})();