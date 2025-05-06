# The Perfect Square

[Live demo here](https://peter-meehan-domokos.github.io/perfect-square/) 

Typescript migration under way. See [this branch](https://github.com/peter-meehan-domokos/perfect-square/tree/typescript).

Note: still under development. 

## Overview

A novel 2D view of multivariate data, or n-dimensional vectors. It places particular focus on the shape of each datapoint, and how far away that shape is from an ideal standard. You can easily compare and group thousands of datapoints. Especially good at showing comparison against an ideal state. Also for visualising clustering and similarity ML algorithms, and for product quantization in a vector database search.

## Examples
 - An injured sports star who is aiming to get back to their pre-injury levels (the ideal state).
 - Visualising a recruitment algorithm which aims to find the person who most fits the required profile.
 - An AI language model which aims to find a match for a word (token) based on similarity.

In these cases, the dataset is normalised by giving a value for each measure as a proporiton of the ideal value for that measure (eg a percentage of the target achieved).
 
## Key features

### Ordering of values

The highest bars, representing the best values of the measures or dimensions, are always towards the centre of the overall square. This makes it easier to see the shape of the overall progress, whilst clicking a bar (coming soon) will still allow tracking of individual measures/dimensions.

### Category selection

There are 4 quadrants to each chart, allowing measures/dimensions to be grouped and summarised as categories, if desired (eg product quantisation to speed up queries, whilst retaining some information which could be delivered in a later request). Up to 4 categories are currently possible.

The user can click a category in the controls panel to highlight and enlarge a particular category. This allows many more datapoints to be glanced at and compared at once due to the increase in what is known in dataviz as the 'data-to-ink' ratio.

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

User can click a particular bar (which represents a measure or a dimension) to highlight that bar in all datapoints, and to see a secondary visual for it, such as a time series or histogram. Not released yet. 

## Technical implementation and requirements

### Development Stack and set-up

This is a client app built with Next.js, React and D3. (Currently Javascript but typescript migration release is imminent).

It uses GraphQL to communicate with a server to retrieve data. GraphQL is a good choice as it provides a clean way to avoid over-fetching of data, which will be an issue when a larger number of datapoints are involved.

The server (written in node, and utilising python child processes for analytics of large datasets) is deployed to heroku, and provides data to a vaeiety of viualisation apps.

PerfectSquare was developed on a chrome browser, and is responsive to all display sizes and devices, including touch. However, it hasn't been tested on other browsers or on mobile devices, so may be unstable if not using chrome on a laptop or PC. Minor bugs exist.

### Some conventions

#### Margin Convention

NOTE TO NON-D3/SVG DEVELOPERS - margin in SVG/D3 world acts as padding in HTML/CSS world, so we get, for example, contentsWidth = width - margin.left - margin.right.
This margin convention is applied throughout the svg code. Every rendering component is ignorant of it's container. It receives it's own dimensions either as settings (if its a full-on 'component') or as an argument (if its just a smaller rendering helper function). If it has a margin, this is applied to derive the contentsWidth and contentsHeight.

#### Naming conventions

Data analytics code does make use of some shorthand names that, on balance, provide more benefits than costs. Mathematical expressiona nd formulae can become complex, and they need to be able to be seen as a whole, which is harder when names are vmultiple syllables. Further, most such people are used to working with mathe,matical conventions too, so shorthands can actually enhancce clarity. Therefore, the following conventions are applied in the code:

Naming Conventions
| 	Shorthand	 | Example | 	Explanation | 	
| 	:-----:	 | 	:-----:	 | 	:-----:	 | 	
| 	e	| 		| 	A dom event - either a source event or a D3 pseudo event that may or may not contain a source event |
| 	d, myComponentD	| chartD, tooltipD | Represents a datum, which is a datapoint that has been through a layout function and been binded to a dom element	| 	
| 	x , y	| 	Horizontal and vertical dimensions	| 
| _variableName | _width | Used for simple functions that return a variable value on a per datapoint basis, esp to distinguish between constant values of the same name. |
| 	variableNameDomElementName	| 	chartG, contentsG	| 	Names that refer to dom elements should always add the name of the element on the end |
| componentLayout (D3 non-React) | perfectSquareLayout | Reserved for functions that take data and prepare it for the component of the same name |
| component (D3 non-React) | perfectSquareComponent | Reserved for functions that take a selection and render an svg component, and often have a settings api |

#### Use of 'this'

The D3 convention is followed that for any function that acts on an element, the element is not passd explicitly but is instead available as the 'this' context of the function. Function that don't use this wil in general be lamda/arrow functions.

#### Use of selection.each

Functions that act on elements, will generally be passed a d3 selection, rather than the raw element(s). This allows components to be used for multiple elements at once. Then, selection.each is used to iterate and extract each element (as 'this') and its datum.

### Architecture of the Main SVG Visual

#### Overview

Each datapoint becomes an instance of a chart inside the overall visual. It is rendered as follows. (React components start with capitals, d3-oriented functions and react hooks in camelCase.)

1. [AppContext](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/context.js) and [VisualContext](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/context.js) provide settings and data to the visual.

2. The general [SVGVisual](https://github.com/peter-meehan-domokos/perfect-square/tree/main/app/_components/visual/SVGVisual) receives the component for the particular visual - perfectSquareComponent here - via the renderProps pattern, and renders it as a child inside an [SVGContainer](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/container.js) component and a [ZoomableG](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/page.js) wrapper which adds zooming.

3. [SVGContainer](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/container.js) calculates dimensional information for the visual, including the container itself, but also the information for a [grid](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/hooks_and_modules/grid.js) layout of all the datapoints (ie charts), and for a simulation of the datapoints (which requires smaller charts). These are provided in an SVGContainerContext.

4. [ZoomableG](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/page.js) sets up zooming, with the help of a [useZoom](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/zoom.js) hook, and provides state and utility functions via a ZoomContext. Some of these are also accessible higher up the chain so that zoom can be externally controlled too.

5. [PerfectSquare](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/page.js) is the React component of the SVG Vis. It passes the data through a layout function, [perfectSquareLayout](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/svgComponents/perfectSquare/layout.js), which prepares the data for the D3 [perfectSquareComponent](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/svgComponents/perfectSquare/component.js), as per the D3 layout-component design pattern. A [simulation hook](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/visual/SVGVisual/hooks_and_modules/simulation/simulation.js) is also called which handles changes that need to be made if the simulation is updated or turned on/off. Finally, various useEffects render/update the charts based on state changes, using the D3 enter-update-exit pattern in [renderCharts]().

6. [perfectSquareComponent](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/svgComponents/perfectSquare/component.js) calls various [subcomponents](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/svgComponents/perfectSquare/subcomponents.js) to render/update a part of each chart, returning the selection to allow chaining.


#### The main D3 component pattern: [perfectSquareComponent](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/svgComponents/perfectSquare/component.js)

The perfectSquareComponent utilises the D3 component design pattern - it uses currying to return an inner function which can then be used to render and update each chart it receives as part of a selection of charts. It uses this inner function approach rather than classes, because this is more consistent with the implementation of D3 itself, allowing for seamless integration of these functions within standard D3 chaining.

#### Settings and callbacks handled at visual-level or chart-level

As per the D3 component pattern, there are settings variables and callback functions that are applied and stored within the scope of some of the d3 components, and can be accessed (get) when called with no argument, or modified (set) when passed an argument. The setter in some cases can be a function or a fixed amount. If it is a function, it is applied individually to each chart/datapoint, allowing datapoint level variations. This is the same as how d3 functions such as d3.force work. For an example, see the width, height and styles settings in [tooltipComponent](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/_perfect-square-visual/_svgComponents/_tooltip/component.js). The implementation uses the underscore convention for functions eg _width is a function, but the api itself does not, in line with D3 components, so .width in some components can take a fixed value or an accessor function.

### Responsiveness

The number of rows and columns is dynamically optimised in a [grid module](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/_perfect-square-visual/_hooks_and_modules/grid.js), according to two factors: (a) the number of charts, and (b) the aspect ratio of the display. 
The main benefit of this approach over a css flexbox is that custom requirements can be set up, which is common in dataviz where the position of elements makes a huge difference to the interpretation of the visual.

Also see semantic zoom (below).

The description in the VisualHeader is hidden in smaller container sizes, with a button to slide it in. Another option is to hide the controls in a similar way.

### Performance Optimisations
   
#### 1. Virtualised Rendering

Only the datapoints on screen are rendered and this is updated on every zoom event. Checking is provided by the general utility higher-order function [isChartOnScreenCheckerFunc](https://github.com/peter-meehan-domokos/perfect-square/blob/main/app/_components/perfect-square/helpers.js) which the zoom hook makes use of.

#### 2. Semantic Zoom

The app applies visual science in terms of the level of detail that the human eye can see at specific distances and sizes to ensure that no unneccesarry elements are rendered. This means there can be thousands of datapoints on screen, or just a few, and in all cases, a similar number of dom elements will be rendered, keeping performance optimal throughout. See Levels Of Detail table further up.

#### 3. D3 Enter-Update-Exit Pattern

Use is made of D3s in-built optimisation capabilities throughout all functions that render elements. This ensures elements are reused where possible, or discarded when not used. It also avoids the need for complex logic to handle dom updates, leaving it to D3s in-built methods.

#### 4. React optimisations

The component life-cycle is utilised at various points to avoid unneccessary updates. There is scope to improve this further, as the data is currently being updated by calling the entire layout function on updates that only require one change, such as the cellX and cellY positions. This is a candidate for memoisation, and more targeted object put into the useEffect dependencies array.

More use of hooks for functionality such as the simulation and the zoom will yield more clarity and reduce the number of unnecessary updates too.

#### 5. Fetch Caching & Avoiding Over-Fetching

The useFetch hook caches the data.

A further option is to reduce the over-fetching when handling a much larger number of datapoints eg many thousands. At this level of detail, we only require the mean value and standard deviation for each datapoint. We can use a secondary request to get the rest of the data, in anticipation that the user will zoom in or select a datapoint. GraphQL is a good choice for this reason.

## More functionality coming soon

   - A similarity score based on machine learning clustering of similar datapoints, visualised through the force-directed network.
   
   - Drilling down into bars (ie measures or dimensions)
     
   - Import data by excel or csv

   - Run an animation to see progress unfold (for temporal sets of data - eg a rehabilitation programme for an injury) alongside other info or videos (eg as part of a larger dashboard)

   - Colour variations for each bar in each quadrant to aid individual tracking without having to lose the auto-ordering




