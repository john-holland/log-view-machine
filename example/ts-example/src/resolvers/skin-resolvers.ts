import { SkinService } from '../services/skin-service';
import { GraphQLContext } from '../types/context';

export const skinResolvers = {
    Query: {
        skin: async (_: any, { id }: { id: string }, { skinService }: GraphQLContext) => {
            return skinService.getSkin(parseInt(id));
        },

        skins: async (_: any, {
            type,
            status,
            authorId,
            limit,
            offset
        }: {
            type?: string;
            status?: string;
            authorId?: string;
            limit?: number;
            offset?: number;
        }, { skinService }: GraphQLContext) => {
            return skinService.listSkins({
                type,
                status,
                author_id: authorId ? parseInt(authorId) : undefined,
                limit,
                offset
            });
        },

        skinCollection: async (_: any, { id }: { id: string }, { skinService }: GraphQLContext) => {
            return skinService.getCollection(parseInt(id));
        },

        skinCollections: async (_: any, {
            curatorId,
            isFeatured,
            limit,
            offset
        }: {
            curatorId?: string;
            isFeatured?: boolean;
            limit?: number;
            offset?: number;
        }, { skinService }: GraphQLContext) => {
            return skinService.listCollections({
                curator_id: curatorId ? parseInt(curatorId) : undefined,
                is_featured: isFeatured,
                limit,
                offset
            });
        },

        myPurchases: async (_: any, {
            limit,
            offset
        }: {
            limit?: number;
            offset?: number;
        }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            return skinService.getUserPurchases(user.id, { limit, offset });
        },

        myRatings: async (_: any, {
            limit,
            offset
        }: {
            limit?: number;
            offset?: number;
        }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            return skinService.getUserRatings(user.id, { limit, offset });
        }
    },

    Mutation: {
        createSkin: async (_: any, { input }: { input: any }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            return skinService.createSkin({
                ...input,
                author_id: user.id,
                status: 'DRAFT'
            });
        },

        updateSkin: async (_: any, { id, input }: { id: string; input: any }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            const skin = await skinService.getSkin(parseInt(id));
            if (!skin) throw new Error('Skin not found');
            if (skin.author_id !== user.id) throw new Error('Not authorized');
            return skinService.updateSkin(parseInt(id), input);
        },

        purchaseSkin: async (_: any, { id }: { id: string }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            const result = await skinService.purchaseSkin(parseInt(id), user.id);
            if (!result.success) throw new Error(result.error);
            return result;
        },

        rateSkin: async (_: any, {
            id,
            rating,
            comment
        }: {
            id: string;
            rating: number;
            comment?: string;
        }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            await skinService.rateSkin(parseInt(id), user.id, rating, comment);
            return skinService.getSkin(parseInt(id));
        },

        createCollection: async (_: any, { input }: { input: any }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            const collectionId = await skinService.createCollection(
                input.name,
                input.description,
                user.id
            );
            return skinService.getCollection(collectionId);
        },

        addSkinToCollection: async (_: any, { input }: { input: any }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            const collection = await skinService.getCollection(parseInt(input.collectionId));
            if (!collection) throw new Error('Collection not found');
            if (collection.curator_id !== user.id) throw new Error('Not authorized');
            await skinService.addSkinToCollection(
                parseInt(input.collectionId),
                parseInt(input.skinId),
                input.position
            );
            return skinService.getCollection(parseInt(input.collectionId));
        },

        removeSkinFromCollection: async (_: any, {
            collectionId,
            skinId
        }: {
            collectionId: string;
            skinId: string;
        }, { skinService, user }: GraphQLContext) => {
            if (!user) throw new Error('Not authenticated');
            const collection = await skinService.getCollection(parseInt(collectionId));
            if (!collection) throw new Error('Collection not found');
            if (collection.curator_id !== user.id) throw new Error('Not authorized');
            await skinService.removeSkinFromCollection(parseInt(collectionId), parseInt(skinId));
            return skinService.getCollection(parseInt(collectionId));
        }
    },

    Skin: {
        author: async (skin: any, _: any, { userService }: GraphQLContext) => {
            return userService.getUser(skin.author_id);
        }
    },

    SkinCollection: {
        curator: async (collection: any, _: any, { userService }: GraphQLContext) => {
            return userService.getUser(collection.curator_id);
        }
    },

    SkinPurchase: {
        skin: async (purchase: any, _: any, { skinService }: GraphQLContext) => {
            return skinService.getSkin(purchase.skin_id);
        },
        buyer: async (purchase: any, _: any, { userService }: GraphQLContext) => {
            return userService.getUser(purchase.buyer_id);
        }
    },

    SkinRating: {
        skin: async (rating: any, _: any, { skinService }: GraphQLContext) => {
            return skinService.getSkin(rating.skin_id);
        },
        rater: async (rating: any, _: any, { userService }: GraphQLContext) => {
            return userService.getUser(rating.rater_id);
        }
    }
}; 