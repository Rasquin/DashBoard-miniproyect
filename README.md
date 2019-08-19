Links needed for css and js

Use wget to download these assets as shown in the video. bootstrap is the 3

https://cdnjs.cloudflare.com/ajax/libs/dc/2.1.8/dc.min.css
https://cdnjs.cloudflare.com/ajax/libs/dc/2.1.8/dc.min.js
https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js
https://cdnjs.cloudflare.com/ajax/libs/crossfilter/1.3.12/crossfilter.min.js
https://cdnjs.cloudflare.com/ajax/libs/queue-async/1.0.7/queue.min.js
https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/2c266c2e91b0ea4835ea1c156e974eb9fc4146c1/csv/carData/Salaries.csv 

order of working

1st you introduce each graphs with the <div id="service-salary"></div> in the html
2nd you make each graph in your js file.
3rd give structure (rows and columns)--->1st the title, 2nd some text, 3rd the graph-->

class="col-md-offset-5"------>
for the div that actually contains the discipline selector we're going to
move it over from the left-hand side five cells in the bootstrap grid system
using a col medium offset so that we'll move that towards the center of
the screen. 