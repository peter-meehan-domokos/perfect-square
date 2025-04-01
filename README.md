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

### Ordering of values

The highest bars, representing the best values of the measures or dimensions, are always towards the centre of the overall square. This makes it easier to see the shape of the overall progress, whilst clicking a bar (coming soon) will still allow tracking of individual measures.

### Categories

There are 4 quadrants to each chart, allowing measures or dimensions to be grouped and summarised as categories, if desired (eg product quantisation to speed up queries, whilst retaining some information which could be delivered in a later request). Up to 4 categories are currently possible, with more options coming soon.

### Arranging the data

The default arrangement is a grid, with rows and columns optimised based on view dimensions.

User can choose to arrange the data by position (x,y) and colour, based on different factors. This applies a d3 force to position each datapoint.

They will soon also be able to group it according to an ML-driven clustering of datapoints based on similarity (back-end logic not released yet)

### Semantic zooming

The user can select a datapoint to zoom in to it, or manually zoom in and pan to a location.
As they zoom in, the user sees more detailed versions of the datapoint.

Levels Of Detail
| 	Level	 | 	Approx number of datapoints | 	Description	of each datapoint | 
| 	:-----:	 | 	:-----:	 | 	:-----:	 | 
| 	0	| 	1000s	| 	A single rectangle, with area proportional to the overall mean value of all measures or dimensions	 | 
| 	1	| 	1000	| 	A single path which outlines the shape that all of the measures or dimensions make	 | 
| 	2	| 	60	| 	One path per quadrant, allowing the shape of each category to be easily identified	 | 
| 	3	| 	30	| 	One bar per measure or dimension of the datapoint	 | 

note: level 0 not released yet

### Drilling down

Not released yet. User can click a particular bar (which represents a measure or a dimension) to highlight that bar in all datapoints, and to see a secondary visual for it, such as a time series or histogram.

## Technical implementation and requirements

### Development Stack and set-up

This is a client app built with Next.js, React and D3. It uses GraphQL to communicate with a server to retrieve data.
The server is deployed to heroku. [Here is the server's github](https://github.com/peter-meehan-domokos/data-server)

It was developed on a chrome browser, and is responsive to all display sizes and devices, including touch. However, it hasn't been tested on other browsers or on mobile devices, so may be unstable if not using chrome on a laptop or PC.

### Architecture of the Visual

#### Overview
Each datapoint becomes a chart inside the visual. It is rendered as follows. (React components start with capitals, d3 components in camel case.)

Visual (gets the data via a useFetch hook)
 -> PerfectSquareVisual (receives the data, and applies the d3 layout function to it)
  -> renderCharts (it renders one g element per datapoint, inside the container, then calls perfectSqaurecomponent on this selection) 
   ->  perfectSquareComponent (recieves a seleciton of gs, and renders/updates a chart on each one) 
    -> subComponents (renders/updates a part of each chart)

#### The main React component
Perfect Square is a [React component]([https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/QuadrantsBarChart.js](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/components/perfect-square-visual/page.js)). 

It runs the data through a [D3 layout function](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/components/perfect-square-visual/perfectSquareLayout.js) to prepare it for the D3 perfectSquareComponent.

It calls renderCharts inside a useEffect, which uses the D3 enter-update-exit pattern to call the [D3 component (perfectSquareComponent)](https://github.com/petedomokos/The_Quadrants_Bar_Chart/blob/master/src/quadrantsBarChart/quadrantsBarChartComponent.js](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/components/perfect-square-visual/perfectSquareComponent.js)), passing it the selection of all charts.

The Main D3 component
The D3 perfectSquareComponent utilises the standard D3 design pattern - it returns an inner function which can then be used to render and update each chart it receives as part of a selection of charts. 

Settings
Also as per standard, there are settings variables that are applied and stored within the scope of the component. These settings can be accessed (get) when called with no argument, or modified (set) when passed an argument. Th


uses inner functions rather than classes, because this is more consistent with the implementation of D3 itself, allowing
for seamless integration of these functions within standard D3 chaining.

There is currently no React redux, context, or hooks used for state management and common tasks (eg container resize), these changes are coming soon. 

### Display Optimsations

Its very important in dataviz that space is used effectively. In this implementation, the number of rows and columns will always be optimised according to two factors: (a) the number of charts, and (b) the aspect ratio of the display. 

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




