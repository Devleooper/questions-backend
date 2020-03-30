import { ISection } from './../models/section.model';
import { OK } from 'http-status';
import { createSection, updateSection, deleteSection, addSharedOption, addQuestion, findSection } from './../services/section.service';
import { Router, Request, Response } from 'express';


export const SectionRouter: Router = Router();

SectionRouter.get('/:sectionid/find', (request: Request, response: Response) => {
    const sectionId = request.params.sectionid;

    findSection(sectionId).then((result: ISection) => {
        response.status(OK).json({ data: result });
    }).catch((err) => {
        response.status(err.code).json(err);
    })
})


SectionRouter.post('/:courseid/create', (request: Request, response: Response) => {
    const courseId = request.params.courseid;
    const body = request.body;
    createSection(body, courseId).then((result: any) => {
        response.status(OK).json(result);
    }).catch((err) => {
        response.status(err.code).json(err);
    })
})

SectionRouter.put('/:sectionid/update', (request: Request, response: Response) => {
    const sectionId = request.params.sectionid;
    const body = request.body;

    updateSection(body, sectionId).then((result: any) => {
        response.status(OK).json(result);
    }).catch((err) => {
        response.status(err.code).json(err);
    })
})


SectionRouter.patch('/:sectionid/shared/:optionid', (request: Request, response: Response) => {
    const sectionId = request.params.sectionid;
    const optionId = request.params.optionid;
    addSharedOption(optionId, sectionId).then((result: any) => {
        response.status(OK).json(result);
    }).catch((err) => {
        response.status(err.code).json(err);
    })
})

SectionRouter.patch('/:sectionid/question/:questionid', (request: Request, response: Response) => {
    const sectionId = request.params.sectionid;
    const questionId = request.params.questionid;
    addQuestion(questionId, sectionId).then((result: any) => {
        response.status(OK).json(result);
    }).catch((err) => {
        response.status(err.code).json(err);
    })
})


SectionRouter.delete('/:sectionid/delete', (request: Request, response: Response) => {
    const sectionId = request.params.sectionid;
    deleteSection(sectionId).then((result: any) => {
        response.status(OK).json(result);
    }).catch((err) => {
        response.status(err.code).json(err);
    })
})