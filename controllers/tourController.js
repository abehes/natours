const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTourById = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if(!tour) {
    return next(new AppError(`No tour found with id (${req.params.id})`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if(!tour) {
    return next(new AppError(`No tour found with id (${req.params.id})`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if(!tour) {
    return next(new AppError(`No tour found with id (${req.params.id})`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/*
  Get Tour stats utilizes the MongoDB Aggregation Pipeline
*/
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty'},
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

/* 
  Unwinding & Projecting
  The '$unwind' operator can take a 'document' which has a field that contains an array and separates them into diff documents
  For example:
  'The Forest Hiker' tour with 3 starting dates can be unwinded so that it can have a different 'document' for each starting date
  
  The '$project' operator takes our document and hides a specified '$field' 0 = hide, 1 = show
  Example: 

  $project: {
    _id: 0
  }
*/
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // Multiply by 1 to easily convert into a number

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //Reference explanation above
    },
    {
      $match: { 
        startDates: { 
          $gte: new Date(`${year}-01-01`), //between first day of ${year}
          $lte: new Date(`${year}-12-31`) //between last day of ${year}
        }
        }
    },
    {
      $group: { 
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' } //$push creates an array using the specified field
      }
    },
    {
      $sort: { 
        _id: 1
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: { 
        _id: 0
      }
    },
    {
      $limit: 12
    }

  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});