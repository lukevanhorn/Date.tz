# Date.tz
Javascript timezone extension for Date

Minimal alternative to libraries such as moment.js.

Compatible with modern browsers and Nodejs v12+  
Earlier versions of Nodejs can be supported by removing references to globalThis

This extends the built-in Date type, adding a Date.tz constructor that takes a timezone argument.

The format() outputs string representations in the correct timezone, applying DST when applicable.

Most functions return a reference to *this* to allow for method chaining.

A timezone may be supplied through the constructor directly or a global *timezone* string. 

### Constructors: 
Date.tz(timestamp, timezone)  //Creates a new date type. Timezone is set by the supplied value or globalThis.timezone if set. 

## Getters/Setters:
### .ms() 
### .second()
### .minute()
### .hour()
### .date()
### .month()
### .year()

## ReadOnly:
### .day()
### .dayOfYear()
### .week()

## Utility functions:
### .format(custom)  //returns a standard datetime string or custom output based on format string  
### .add(count, unit)  //Modifies the date object by adding or subtracting the supplied values
### .subtract(count, unit) //same as add(count * -1, unit)
### .resetDay()  //Modifies the date object to the start of the current day
### .getParts()  //returns an object with date part attributes

### Date.duration([timestamp or count, timestamp or unit])  //returns an object/functions to caculate or format timespans

See inline code documentation for more information and examples.