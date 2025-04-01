# The Perfect Square

[Live demo here](https://peter-meehan-domokos.github.io/perfect-square/) 

## Overview

A novel 2D view multivariate data, or n-dimensional vectors, that p,laces particular focus on the shape of each datapoint. You can easily compare and group thousands of datapoints. Especially good at showing comparison against an ideal state. Also for visualising clustering and similarity ML algorithms, and for product quantization in a vector database search.

## Examples
 - An injured sports star who is aiming to get back to their pre-injury levels (the ideal state).
 - Visualising a recruitment algorithm which aims to find the person who most fits the required profile.
 - An AI language model which aims to find a match for a word (token) based on similarity.

In these cases, the dataset is normalised by giving a value for each measure as a proporiton of the ideal value for that measure (eg a percentage of the target achieved).
 
## Key features

### Ordering of measures

The highest bars, representing the best values, are always towards the centre of the overall square. This makes it easier to see the shape of the overall progress, whilst clicking a bar (coming soon) will still allow tracking of individual measures.

### Categories

There are 4 quadrants to each chart, allowing measures or dimensions to be grouped and summarised as categories, if desired (eg product quantisation to speed up queries, whilst retaining some information which could be delivered in a later request). Up to 4 categories are currently possible, with more options coming soon.

### Semantic zooming and drilling down

The user can select a datapoint to zoom in to it, or manually zoom in and pan to a location.
As they zoom in, the user sees more detailed versions of the datapoint.

Levels Of Detail
| 	header1	 | 	header2	 | 	header3	 | 
| 	:-----:	 | 	:-----:	 | 	:-----:	 | 
| 	Value1	| 	Value2	| 	Value3	 | 
| 	Value1	| 	Value2	| 	Value3	 | 
| 	Value1	| 	Value2	| 	Value3	 | 
| 	Value1	| 	Value2	| 	Value3	 | 
| 	Value1	| 	Value2	| 	Value3	 | 

 - 0 - each datapoint is a single rectangle, with area proportional to the overall mean value of all measures or dimensions (not implemented yet).
 - 1 - each datapoint is a single path which outlines the shape that all of the measures or dimensions make.
 - 2 - 

### Grid display optimisation

Its very important in dataviz that space is used effectively. In this implementation, the number of rows and columns will always be optimised according to two factors: (a) the number of charts, and (b) the aspect ratio of the display. 

## Technical implementation and requirements

### Development Stack 

This is React plus D3 project, developed on a chrome browser, and is responsive to all display sizes. However, it hasn't been tested on other browsers or mobile devices. 

not optimised for mobile/tablet or non-chrome browsers yet, although can be viewed on it.

The server is deployed to heroku. [Here is the server's github](https://github.com/peter-meehan-domokos/data-server)

### Architecture

The data (currently mock) runs through two preparation functions. The first prepares the data to be applied to generic visualisations. The second is a [D3 layout function](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/quadrantsBarChartLayout.js) to prepare it for the D3 quadrantsBarChartComponent.

D3 runs on an svg element that is rendered within a [React component](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/QuadrantsBarChart.js).

The [D3 component (quadrantsBarChartComponent)](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/quadrantsBarChartComponent.js) uses inner functions rather than classes, because this is more consistent with the implementation of D3 itself, allowing
for seamless integration of these functions within standard D3 chaining.

There is currently no React redux, context, or hooks used for state management and common tasks (eg container resize), these changes are coming soon. 


### Performance Optimisation

#### List (Virtualised) Rendering

#### Semantic zoom

#### D3 enter-update-exit

#### React optimisations

#### Fetch Optimisations (not done yet)

I will optimise the fetch for ds, by only loading
the mean and std dev values for each datapoint when nr ds > 1000.
Because we know that the levelOfDetail will start as 0 (ie the new 1) anyway

## Responsiveness

Not fully testes on devices, not touch, sizes are ok, but non-chrome browsers not

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




