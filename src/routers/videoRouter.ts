import express, { Request, Response } from "express";
import { Secret, sign } from "jsonwebtoken";
import verifyToken from "../middleware/auth";
import { dataSource } from "../data-source";
import { Admin } from "../entities/Admin";
import { Video } from "../entities/Video";
import { Topic } from "../entities/Topic";
import { In, Like } from "typeorm";
import { TAKE_VIDEO } from "../utils/constants";
import { Suggest } from "../entities/Suggest";

const videoRouter = express.Router();

videoRouter.use("/admin/topic/create", verifyToken);
videoRouter.use("/admin/topic/edit", verifyToken);
videoRouter.use("/admin/video/get/all", verifyToken);
videoRouter.use("/admin/video/create", verifyToken);
videoRouter.use("/admin/video/edit", verifyToken);
videoRouter.use("/admin/video/delete", verifyToken);
videoRouter.use("/admin/suggest/get/all", verifyToken);
videoRouter.use("/admin/suggest/delete", verifyToken);

// Admin Login
videoRouter.post("/admin/login", async (req: Request, res: Response) => {
  try {
    const { account } = req.body;

    if (!account)
      return res.status(400).json({
        success: false,
        message: "Account not found",
      });

    const adminRepository = dataSource.getRepository(Admin);
    const admin = await adminRepository.findOne({
      where: {
        account,
      },
    });

    if (!admin)
      return res.json({
        success: false,
        message: "Admin not found",
      });

    const token = sign(
      {
        account,
      },
      process.env.ADMIN_TOKEN_SECRET as Secret,
      {
        expiresIn: "240m",
      }
    );

    const suggestRepository = dataSource.getRepository(Suggest);

    const suggestCount = await suggestRepository.count();

    return res.status(200).json({
      success: true,
      message: "login successfully",
      token,
      suggestCount: suggestCount,
    });
  } catch (error) {
    console.log(`Create admin error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//Create Video
videoRouter.post("/admin/video/create", async (req: Request, res: Response) => {
  try {
    const { title, url, topicList, source, keyword } : {
      title:string,
      url:string,
      topicList:Topic[],
      source:string,
      keyword:string
    } = req.body;
   
   
    if (!topicList || topicList.length < 1)
      return res.status(400).json({
        success: false,
        message: "Not have any topic",
      });
    const videoRepository = dataSource.getRepository(Video);
    const video = new Video();
    if (title) video.title = title;
    if (source) video.source = source;
    video.topics = topicList;
    video.url = url;
    video.keyword = keyword;
    await videoRepository.save(video);

    return res.status(200).json({
      success: true,
      message:"Create video successfully!"
    });
  } catch (error) {
    console.log(`Create video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//Edit Video
videoRouter.post("/admin/video/edit", async (req: Request, res: Response) => {
  try {
    const { video }: { video: Video } = req.body;
    if (!video)
      return res.status(400).json({
        success: false,
        message: "Video not found",
      });
    const videoRepository = dataSource.getRepository(Video);
    await videoRepository.save(video);
    return res.status(200).json({
      success: true,
      message: "Update video successfully!",
    });
  } catch (error) {
    console.log(`Edit video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//Delete Video
videoRouter.post("/admin/video/delete", async (req: Request, res: Response) => {
  try {
    const { video }: { video: Video } = req.body;
    if (!video)
      return res.status(400).json({
        success: false,
        message: "Video not found",
      });
      await dataSource
      .createQueryBuilder()
      .delete()
      .from(Video)
      .where("videoId = :videoId", { videoId: video.videoId })
      .execute();
    return res.status(200).json({
      success: true,
      message: "Delete video successfully!",
    });
  } catch (error) {
    console.log(`Delete video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//download Video
videoRouter.post("/video/download", async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;
    if (!videoId)
      return res.status(400).json({
        success: false,
        message: "VideoId not found",
      });
    const videoRepository = dataSource.getRepository(Video);
   const video = await videoRepository.findOne({
      where:{
        videoId
      }
    });
    if(!video)
    return res.status(404).json({
      success: true,
      message: "Video not found",
    });

    video.downloadedCounting+=1;
    await videoRepository.save(video);
    return res.status(200).json({
      success:true,
      message:"Download video successfully!"
    })
  } catch (error) {
    console.log(`Delete video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//Get one Video
videoRouter.get("/video/get/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id)
      return res.status(400).json({
        success: false,
        message: "Id not found",
      });

    const videoRepository = dataSource.getRepository(Video);
    const video = await videoRepository.findOne({
      where: {
        videoId: id,
      },
      relations:["topics"]
    });
    if (!video)
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    return res.status(200).json({
      success: true,
      message: "get one video successfully!",
      video,
    });
  } catch (error) {
    console.log(`Get one video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//Get all Video
videoRouter.post("/video/get/all", async (req: Request, res: Response) => {
  try {
    const { skip, search, topicList } :{
      skip:number,
      search:string,
      topicList:string[]
    } = req.body;
    let query: any = { 
      skip,
      take: TAKE_VIDEO,
      order: {
        createdAt: "DESC",
      },
      relations: ["topics"],
    };
    let countQuery: any = {};
    if (search) {
      query.where = {
        keyword: Like(`%${search.trim()}%`),
      };
      countQuery.where = {
        keyword: Like(`%${search.trim()}%`),
      };
    }
    if (topicList && topicList.length>0) {
      query.where = {
        topics: {
          name: In(topicList),
        },
      };
      countQuery.where = {
        topics: {
          name: In(topicList),
        },
      };
    }
    const videoRepository = dataSource.getRepository(Video);
    const videos = await videoRepository.find(query);
    const videosCounting = await videoRepository.count(countQuery);

    if (videos.length < 1) {
      return res.status(200).json({
        success: true,
        message: "Not found any video",
      });
    }
 
    

    return res.status(200).json({
      success: true,
      message: "Get all video",
      totalCount: videosCounting,
      videos,
      hasMore: skip + TAKE_VIDEO < videosCounting,
    });
  } catch (error) {
    console.log(`Get all video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//admin get downloadCounting

videoRouter.post("/admin/video/get/all", async (req: Request, res: Response) => {
  try {
    const { skip } :{
      skip:number
    
    } = req.body;
    

  
   
    const videoRepository = dataSource.getRepository(Video);
    const videos = await videoRepository.find({
      order:{
        downloadedCounting:"DESC"
      },
      take:TAKE_VIDEO,
      skip
    });
    const videosCounting = await videoRepository.count();

    if (videos.length < 1) {
      return res.status(200).json({
        success: true,
        message: "Not found any video",
      });
    }
 
    

    return res.status(200).json({
      success: true,
      message: "Get all video",
      totalCount: videosCounting,
      videos,
      hasMore: skip + TAKE_VIDEO < videosCounting,
    });
  } catch (error) {
    console.log(`Get all video error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//create Topic
videoRouter.post("/admin/topic/create", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const topicRepository = dataSource.getRepository(Topic);
    const topic = await topicRepository.findOne({
      where: {
        name,
      },
    });
    if (topic) {
      return res.status(400).json({
        success: false,
        message: "Topic already exist",
      });
    } else {
      const newTopic = new Topic();
      newTopic.name = name;
      await topicRepository.save(newTopic);
      return res.status(200).json({
        success: true,
        message: "Create topic successfully!",
      });
    }
  } catch (error) {
    console.log(`Create topic error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});



//get all Topic
videoRouter.post("/topic/get/all", async (_: Request, res: Response) => {
  try {
    const topicRepository = dataSource.getRepository(Topic);
    const topics = await topicRepository.find();
    if (topics.length > 0)
      return res.status(200).json({
        success: true,
        message: "Get all topic",
        topics,
      });
    return res.status(400).json({
      success: false,
      message: "Topic not found",
    });
  } catch (error) {
    console.log(`Create topic error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//edit Topic
videoRouter.post("/admin/topic/edit", async (req: Request, res: Response) => {
  try {
    const { topicNameOld,topicNameNew } :{
      topicNameOld : string,
      topicNameNew :string
    } = req.body;
    if (!topicNameOld || !topicNameNew)
      return res.status(400).json({
        success: false,
        message: "topicName not found",
      });
    const topicRepository = dataSource.getRepository(Topic);
    const topic = await topicRepository.findOne({
      where:{
        name:topicNameOld.trim()
      }
    })
    if(!topic) return res.status(200).json({
      success:false,
      message:"Topic not found"
    })
    topic.name = topicNameNew.trim()
    await topicRepository.save(topic);
    return res.status(200).json({
      success: true,
      message: "Update topic successfully!",
    });
  } catch (error) {
    console.log(`Edit topic error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//delete Topic
// videoRouter.post("/admin/topic/delete", async (req: Request, res: Response) => {
//     try {
//         const {topic} : {topic: Topic} = req.body;
//         if(!topic) return res.status(400).json({
//             success:false,
//             message:"Topic not found"
//         })
//         const topicRepository= dataSource.getRepository(Topic);
//         await topicRepository.delete(topic);
//         return res.status(200).json({
//             success:true,
//             message:"Delete topic successfully!"
//         })
//       } catch (error) {
//         console.log(`Delete topic error : ${error}`);
//         return res.status(500).json({
//           success: false,
//           message: "See at console",
//         });
//       }
// });

// create Suggest
videoRouter.post("/suggest/create", async (req: Request, res: Response) => {
  try {
    const {
      link,
      email,
    }: {
      link: string;
      email: string;
    } = req.body;
    if (!link)
      return res.status(400).json({
        success: false,
        message: "Link not found",
      });
    const suggestRepository = dataSource.getRepository(Suggest);
    const suggest = new Suggest();
    suggest.link = link;
    if (email) suggest.email = email;
    await suggestRepository.save(suggest);
    let message =
      email.length > 0
        ? "Cảm ơn bạn đã đề xuất tạo video, mình sẽ upload sớm nhất và gửi thông báo về email của bạn"
        : "Cảm ơn bạn đã đề xuất tạo video,chúc bạn có một ngày nhiều niềm vui nha ^^";
    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.log(`create suggest error : ${error}`);
    return res.status(500).json({
      success: false,
      message: "See at console",
    });
  }
});

//get all suggest
videoRouter.post(
  "/admin/suggest/get/all",
  async (_: Request, res: Response) => {
    try {
      const suggestRepository = dataSource.getRepository(Suggest);
      const suggestList = await suggestRepository.find({
        order: {
          createdAt: "DESC",
        },
      });

      return res.status(200).json({
        success: true,
        message: "get all suggest successfully!",
        suggestList,
      });
    } catch (error) {
      console.log(`get all suggest error : ${error}`);
      return res.status(500).json({
        success: false,
        message: "See at console",
      });
    }
  }
);

//delete suggest
videoRouter.post(
  "/admin/suggest/delete",
  async (req: Request, res: Response) => {
    try {
      const { suggest }: { suggest: Suggest } = req.body;


      await dataSource
        .createQueryBuilder()
        .delete()
        .from(Suggest)
        .where("suggestId = :suggestId", { suggestId: suggest.suggestId })
        .execute();

      return res.status(200).json({
        success: true,
        message: "delete suggest successfully!",
      });
    } catch (error) {
      console.log(`delete suggest error : ${error}`);
      return res.status(500).json({
        success: false,
        message: "See at console",
      });
    }
  }
);

export default videoRouter;
