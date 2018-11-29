queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) { //here will be all our graphs. Here we call the function of each graph
    var ndx = crossfilter(salaryData);

    salaryData.forEach(function(d) { //by default, the salary column is read as text, we want it to be read as a number (integer)
        d.salary = parseInt(d.salary);
    })

    show_discipline_selector(ndx);
    show_percent_that_are_professors(ndx, "Female", "#percent-of-women-professors");
    show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors");

    show_gender_balance(ndx); //we create a new function which argument is the new ndx. This funtion is not declared yet.

    show_average_salary(ndx);
    show_rank_distribution(ndx);



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
            if (v.sex === gender) {// we ensure that we are dealing with the same gender
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
        .formatNumber(d3.format(".2%"))//percentage to two decimal places
        .valueAccessor(function(d) {//because of course we used a custom reducer so our values have a count part and an our prof part right now
            if (d.count == 0) {// dont care about the %, it is just 0
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
        .width(400)
        .height(300)
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
        .width(400)
        .height(300)
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
        .width(400)
        .height(300)
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
        .margins({ top: 10, right: 100, bottom: 30, left: 30 });
}
