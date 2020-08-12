const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'success',
      data: err
    });
  }
};


/*

  Get Tour stats utilizes the MongoDB Aggregation Pipeline

*/
exports.getTourStats = async (req, res) => {
  try {
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
      },
      /*{
        $sort: { 
          avgPrice: 1
        }
      },
      {
        $match: { 
          _id: {$ne: 'EASY'}
        }
      }*/
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });


  } catch (err) {
    res.status(400).json({
      status: 'success',
      data: err
    });
  }
}


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
exports.getMonthlyPlan = async (req, res) => {
  try {

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

  } catch (err) {
    res.status(400).json({
      status: 'success',
      data: err
    });
  }
}