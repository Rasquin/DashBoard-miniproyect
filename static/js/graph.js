queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) { //here will be all our graphs. Here we call the function of each graph
    var ndx = crossfilter(salaryData);

    salaryData.forEach(function(d) { //by default, the salary column is read as text, we want it to be read as a number (integer)
        d.salary = parseInt(d.salary);
        d.yrs_service = parseInt(d["yrs.service"]) //wrapping that in the square bracket and quotes rather than using the dot notation because years of service actually has a dot 
        d.yrs_since_phd = parseInt(d["yrs.since.phd"])
    })

    show_discipline_selector(ndx);
    show_percent_that_are_professors(ndx, "Female", "#percent-of-women-professors");
    show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors");

    show_gender_balance(ndx); //we create a new function which argument is the new ndx. This funtion is not declared yet.

    show_average_salary(ndx);
    show_rank_distribution(ndx);

    show_service_to_salary_correlation(ndx);
    show_phd_to_salary_correlation(ndx)



    dc.renderAll(); // if we don't write this here, it won't work

}

function show_discipline_selector(ndx) {
    var dim = ndx.dimension(dc.pluck('discipline'));
    var group = dim.group();

    dc.selectMenu('#discipline-selector')
        .dimension(dim)
        .group(group);
}

function show_percent_that_are_professors(ndx, gender, element) {
    var percentageThatAreProf = ndx.groupAll().reduce( //1st we calculate the % of professors
        function(p, v) {
            if (v.sex === gender) { // we ensure that we are dealing with the same gender
                p.count++;
                if (v.rank === "Prof") { // only interesed in increasing the counter if the gender  is the same than sex
                    p.are_prof++;
                }
            }
            return p;
        },
        function(p, v) {
            if (v.sex === gender) {
                p.count--;
                if (v.rank === "Prof") {
                    p.are_prof--;
                }
            }
            return p;
        },
        function() {
            return { count: 0, are_prof: 0 };
        },
    );

    dc.numberDisplay(element)
        .formatNumber(d3.format(".2%")) //percentage to two decimal places
        .valueAccessor(function(d) { //because of course we used a custom reducer so our values have a count part and an our prof part right now
            if (d.count == 0) { // dont care about the %, it is just 0
                return 0;
            }
            else {
                return (d.are_prof / d.count);
            }
        })
        .group(percentageThatAreProf)
}




function show_gender_balance(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    var group = dim.group();

    dc.barChart('#gender-balance')
        // dc.barChart("#gender-balance")
        .width(350)
        .height(250)
        .margins({ top: 10, right: 50, bottom: 30, left: 50 })
        .dimension(dim) // cual seran sus x
        .group(group) //cual seran sus y
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal) // because are names
        //.elasticY(true) we deactivate this because then, what chamge is the y axis and not the bars
        .xAxisLabel("Gender")
        .yAxis().ticks(20);

}

/*-----------------------------------------------------------------------------------------------------------BarChart*/
function show_average_salary(ndx) {
    var dim = ndx.dimension(dc.pluck('sex')); //here we have the x's


    //for the y's we need to calculate the average (new values of our x's)
    //remember you always have to make 3 functions: Add, Remove and Initialise

    function add_item(p, v) {
        p.count++;
        p.total += v.salary;
        p.average = p.total / p.count;
        return p;
    }

    function remove_item(p, v) {
        p.count--;
        if (p.count == 0) {
            p.total = 0;
            p.average = 0;
        }
        else {
            p.total -= v.salary;
            p.average = p.total / p.count;
        }
        return p;
    }

    function initialise() {
        return { count: 0, total: 0, average: 0 };
    }

    //and finally you have got your average for each x :)
    var averageSalaryByGender = dim.group().reduce(add_item, remove_item, initialise);

    //and now we can make our barchart
    dc.barChart('#average-salary')
        .width(350)
        .height(250)
        .margins({ top: 10, right: 50, bottom: 30, left: 50 })
        .dimension(dim) // the dim we calculated ir at the beggining of this same function
        .group(averageSalaryByGender) // all the calculates that we had to do to get these values ...  :(
        .valueAccessor(function(d) { //we need to write a value accessor to specify which of those three values(add,remove or initialise) actually gets plotted 
            return d.value.average.toFixed(2); // in the position [2] we find the average.// to Fixed  round that to two decimal places 
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(5);
}

/*-----------------------------------------------------------------------------------------------------------BarChart*/
function show_rank_distribution(ndx) {

    function rankByGender(dimension, rank) {
        return dimension.group().reduce(
            function(p, v) {
                p.total++;
                if (v.rank == rank) {
                    p.match++;
                }
                return p;
            },
            function(p, v) {
                p.total--;
                if (v.rank == rank) {
                    p.match--;
                }
                return p;
            },
            function() {
                return { total: 0, match: 0 };
            }
        );
    }

    var dim = ndx.dimension(dc.pluck("sex")); //same x's as the 2 previos charts
    var profByGender = rankByGender(dim, "Prof"); // we have 3 gruops for our y's, previuosly calculate by the ranByGender function
    var asstProfByGender = rankByGender(dim, "AsstProf");
    var assocProfByGender = rankByGender(dim, "AssocProf");

    dc.barChart("#rank-distribution")
        .width(350)
        .height(250)
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "Asst Prof") // use stack method to attacht the other 2 groups
        .stack(assocProfByGender, "Assoc Prof")
        .valueAccessor(function(d) {
            if (d.value.total > 0) {
                return (d.value.match / d.value.total) * 100;
            }
            else {
                return 0;
            }
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)

        .legend(dc.legend().x(320).y(20).itemHeight(15).gap(5)) // to tell us what is what
        .margins({ top: 10, right: 100, bottom: 30, left: 30 })
        .xAxisLabel("Gender")
        .yAxis().ticks(10);
}

/*-----------------------------------------------------------------------------------------------------------scatter plot*/
function show_service_to_salary_correlation(ndx) {

    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    var eDim = ndx.dimension(dc.pluck("yrs_service")); //the x's, we will need these to get the min and max amouont of servce's years
    var experienceDim = ndx.dimension(function(d) { //returns an array with two parts; one being the year or years of service and the other being the salary and this is what allows us to plot the dots of the scatter plot at the right x and y coordinates
        return [d.yrs_service, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = experienceDim.group();

    var minExperience = eDim.bottom(1)[0].yrs_service; //to get the minimun. Check that you extract the min and max from eDim, the same of your dimension previously declared.
    var maxExperience = eDim.top(1)[0].yrs_service; //to get the maximun

    dc.scatterPlot("#service-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience, maxExperience]))
        .brushOn(false)
        .symbolSize(8) //size of the dot
        .clipPadding(10) //leaves room near the top so that if we have a plot that's right on the top there is actually room for it we'll then label our y-axis 
        .xAxisLabel("Years Of Service")
        .yAxisLabel("Salary")
        .title(function(d) { //the title is going to be what will appear if you hover the mouse over a dot
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function(d) { // decide which piece of data will choose for the colors
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({ top: 10, right: 50, bottom: 75, left: 75 });
}


/*-----------------------------------------------------------------------------------------------------------Scatter Plot*/
function show_phd_to_salary_correlation(ndx) {

    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    var pDim = ndx.dimension(dc.pluck("yrs_since_phd"));
    var phdDim = ndx.dimension(function(d) {
        return [d.yrs_since_phd, d.salary, d.rank, d.sex];
    });
    var phdSalaryGroup = phdDim.group();

    var minPhd = pDim.bottom(1)[0].yrs_since_phd;
    var maxPhd = pDim.top(1)[0].yrs_since_phd;

    dc.scatterPlot("#phd-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minPhd, maxPhd]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .xAxisLabel("Years Since PhD")
        .yAxisLabel("Salary")
        .title(function(d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function(d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(phdDim)
        .group(phdSalaryGroup)
        .margins({ top: 10, right: 50, bottom: 75, left: 75 });
}
