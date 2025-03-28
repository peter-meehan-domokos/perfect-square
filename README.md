# The Perfect Square

[Live demo here](https://peter-meehan-domokos.github.io/perfect-square/) 

## Overview

A novel 2D view multivariate data, or n-dimensional vectors. Yu can easily compare and group thousands of datapoints according to each point's individual shape. Especially good at showing comparison against an ideal state. Also good for visualising clustering and similarity ML algorithms.

For example, an injured sports star who is aiming to get back to their pre-injury levels (the ideal state).
Or a recruitment algorithm which aims to find the person who most fits the required profile. Or an AI language model which aims to find a match for a word (token) based on similarity.

In these cases, the dataset is normalised by giving a value for each measure as a proporiton of the ideal value for that measure (eg a percentage of the target achieved).
 
## Key features

### Ordering of measures

The highest bars, representing the best values, are always towards the centre of the overall square. This make it easier to see the shape of the overall progress, at the expense of the ability to track progress for a particular bar. User will soon be able to remove auto-ordering when they want to track several specific bars more than the overall progress.

In our sports rehabilitation example, whereas an executive (or manager) may want to just know the overall shape for all injured players, a coach or physio would be more interested in the specific bars.

### Categories

It is particularly useful when each vector needs to be grouped into categories/subvectors (see rehab example below). 
It can therefore also visualise the product quantization process in a vector database search.

### Drilling down

User can select a quadrant, and it will enlarge. It is not yet possible to see info on bars or to drill down into bars.

### Zooming and panning

In large datasets, like example 2, it is helpful for the user to zoom in (spreading fingers) and pan the data. (This will become more useful once drilling down is available).

### Grid display optimisation

Its very important in dataviz that space is used effectively. In this implementation, the number of rows and columns will always be optimised according to two factors: (a) the number of charts, and (b) the aspect ratio of the display. 

## Technical implementation and requirements

### Development Stack 

This is React plus D3 project, developed on a chrome browser, and is responsive to all display sizes. However, it hasn't been tested on other browsers or mobile devices. 

not optimised for mobile/tablet or non-chrome browsers yet, although can be viewed on it.

### Architecture

The data (currently mock) runs through two preparation functions. The first prepares the data to be applied to generic visualisations. The second is a [D3 layout function](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/quadrantsBarChartLayout.js) to prepare it for the D3 quadrantsBarChartComponent.

D3 runs on an svg element that is rendered within a [React component](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/QuadrantsBarChart.js).

The [D3 component (quadrantsBarChartComponent)](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/quadrantsBarChartComponent.js) uses inner functions rather than classes, because this is more consistent with the implementation of D3 itself, allowing
for seamless integration of these functions within standard D3 chaining.

There is currently no React redux, context, or hooks used for state management and common tasks (eg container resize), these changes are coming soon. 


### Optimisation

#### List (Virtualised) Rendering

#### Semantic zoom

#### D3 enter-update-exit

#### React optimisations

#### Fetch Optimisations (not done yet)

I will optimise the fetch for ds, by only loading
the mean and std dev values for each datapoint when nr ds > 1000.
Because we know that the levelOfDetail will start as 0 (ie the new 1) anyway

## Some Known Issues

 - zoom ctrls zoom from 0,0 not centre...(note: if we go from centre, then need to adjust the isChartOnScreenChecker function)
 - BUG - zooming out with - can override translate extent, so need to put in a check for these bounds,
 - if user selects a chart whilst force is running, need to cut smoothly to the end position of the simulation before zooming in


## More functionality coming soon

   - A similarity score based on machine learning clustering of similar datapoints, visualised through the force-directed network.
   
   - Hover or tap the bars for an info popup/tooltip

   - Run an animation to see progress unfold alongside other info or videos (eg as part of a larger dashboard)

   - Remove auto-ordering of bars to make tracking particular bars easier ( but tracking the overall shape becomes harder)
     
   - Colour variations for each bar in each quadrant to aid individual tracking without having to lose the auto-ordering




