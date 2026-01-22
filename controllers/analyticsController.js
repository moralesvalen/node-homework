const { StatusCodes } = require("http-status-codes");
const prisma = require("../db/prisma");

const getUserAnalytics = async (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid user ID",
    });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: { id: true },
    });

    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: { id: true },
    });

    return res.status(StatusCodes.OK).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    return next(err);
  }
};

const getUsersWithStats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid pagination parameters",
      });
    }

    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: { isCompleted: false },
          select: { id: true, title: true, priority: true },
          take: 5,
        },
        _count: {
          select: { Task: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: {
        tasks: user._count.Task,
      },
      Task: user.Task,
    }));

    const totalUsers = await prisma.user.count();
    const pages = Math.ceil(totalUsers / limit);

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };

    return res.status(StatusCodes.OK).json({
      users,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
};

const searchTasks = async (req, res, next) => {
  try {
    const searchQuery = req.query.q;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }

    const limit = parseInt(req.query.limit) || 20;

    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    const results = await prisma.$queryRaw`
      SELECT
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    return res.status(200).json({
      results,
      query: searchQuery,
      count: results.length,
    });
  } catch (err) {
    return next(err);
  }
};

const getUsersWithTaskStats = getUsersWithStats;

module.exports = {
  getUserAnalytics,
  getUsersWithStats,
  getUsersWithTaskStats,
  searchTasks,
};
