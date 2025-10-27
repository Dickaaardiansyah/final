import Recipes from '../models/recipeModel.js';
import { Op } from 'sequelize';

// Get all recipes
export const getAllRecipes = async (req, res) => {
    try {
        const { page = 1, limit = 100, search = '', fish_name = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};

        // Search filter
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { fish_name: { [Op.like]: `%${search}%` } },
                { ingredients: { [Op.like]: `%${search}%` } }
            ];
        }

        // Filter by fish name
        if (fish_name) {
            whereClause.fish_name = { [Op.like]: `%${fish_name}%` };
        }

        const recipesData = await Recipes.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            msg: "Data resep berhasil diambil",
            data: recipesData.rows,
            pagination: {
                total_items: recipesData.count,
                current_page: parseInt(page),
                items_per_page: parseInt(limit),
                total_pages: Math.ceil(recipesData.count / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// Get recipe by ID
export const getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await Recipes.findByPk(id);

        if (!recipe) {
            return res.status(404).json({ msg: "Resep tidak ditemukan" });
        }

        res.status(200).json({
            msg: "Data resep berhasil diambil",
            data: recipe
        });

    } catch (error) {
        console.error('Error fetching recipe by ID:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// Get recipes by fish name
export const getRecipesByFishName = async (req, res) => {
    try {
        const { fishName } = req.params;
        const { page = 1, limit = 100 } = req.query;
        const offset = (page - 1) * limit;

        const recipesData = await Recipes.findAndCountAll({
            where: {
                fish_name: { [Op.like]: `%${fishName}%` }
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (recipesData.count === 0) {
            return res.status(404).json({ 
                msg: `Tidak ada resep untuk ikan ${fishName}` 
            });
        }

        res.status(200).json({
            msg: `Data resep untuk ${fishName} berhasil diambil`,
            data: recipesData.rows,
            pagination: {
                total_items: recipesData.count,
                current_page: parseInt(page),
                items_per_page: parseInt(limit),
                total_pages: Math.ceil(recipesData.count / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching recipes by fish name:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// Create new recipe
export const createRecipe = async (req, res) => {
    try {
        const { fish_name, title, image_url, ingredients, instructions } = req.body;

        // Validasi input wajib
        if (!fish_name || !title || !ingredients || !instructions) {
            return res.status(400).json({
                msg: "Nama ikan, judul, bahan-bahan, dan instruksi wajib diisi"
            });
        }

        // Validasi panjang text
        if (title.length < 5) {
            return res.status(400).json({
                msg: "Judul resep minimal 5 karakter"
            });
        }

        if (ingredients.length < 10) {
            return res.status(400).json({
                msg: "Bahan-bahan minimal 10 karakter"
            });
        }

        if (instructions.length < 20) {
            return res.status(400).json({
                msg: "Instruksi minimal 20 karakter"
            });
        }

        // Create recipe
        const newRecipe = await Recipes.create({
            fish_name: fish_name.trim(),
            title: title.trim(),
            image_url: image_url?.trim() || null,
            ingredients: ingredients.trim(),
            instructions: instructions.trim()
        });

        res.status(201).json({
            msg: "Resep berhasil ditambahkan",
            data: newRecipe
        });

    } catch (error) {
        console.error('Error creating recipe:', error);

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                msg: "Data tidak valid",
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        if (error.name === "SequelizeDatabaseError") {
            if (error.original?.code === 'ER_DATA_TOO_LONG') {
                return res.status(413).json({
                    msg: "Data terlalu besar untuk disimpan"
                });
            }
        }

        res.status(500).json({ msg: "Server error" });
    }
};

// Update recipe
export const updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const { fish_name, title, image_url, ingredients, instructions } = req.body;

        const recipe = await Recipes.findByPk(id);

        if (!recipe) {
            return res.status(404).json({ msg: "Resep tidak ditemukan" });
        }

        // Build update object
        const updateData = {};
        
        if (fish_name !== undefined) {
            if (fish_name.trim().length < 2) {
                return res.status(400).json({
                    msg: "Nama ikan minimal 2 karakter"
                });
            }
            updateData.fish_name = fish_name.trim();
        }

        if (title !== undefined) {
            if (title.trim().length < 5) {
                return res.status(400).json({
                    msg: "Judul resep minimal 5 karakter"
                });
            }
            updateData.title = title.trim();
        }

        if (image_url !== undefined) {
            updateData.image_url = image_url?.trim() || null;
        }

        if (ingredients !== undefined) {
            if (ingredients.trim().length < 10) {
                return res.status(400).json({
                    msg: "Bahan-bahan minimal 10 karakter"
                });
            }
            updateData.ingredients = ingredients.trim();
        }

        if (instructions !== undefined) {
            if (instructions.trim().length < 20) {
                return res.status(400).json({
                    msg: "Instruksi minimal 20 karakter"
                });
            }
            updateData.instructions = instructions.trim();
        }

        // Check if there's any data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                msg: "Tidak ada data yang diperbarui"
            });
        }

        // Update recipe
        await recipe.update(updateData);

        res.status(200).json({
            msg: "Resep berhasil diperbarui",
            data: recipe
        });

    } catch (error) {
        console.error('Error updating recipe:', error);

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                msg: "Data tidak valid",
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        if (error.name === "SequelizeDatabaseError") {
            if (error.original?.code === 'ER_DATA_TOO_LONG') {
                return res.status(413).json({
                    msg: "Data terlalu besar untuk disimpan"
                });
            }
        }

        res.status(500).json({ msg: "Server error" });
    }
};

// Delete recipe
export const deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;

        const recipe = await Recipes.findByPk(id);

        if (!recipe) {
            return res.status(404).json({ msg: "Resep tidak ditemukan" });
        }

        await recipe.destroy();

        res.status(200).json({
            msg: "Resep berhasil dihapus"
        });

    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// Get unique fish names (untuk dropdown/filter)
export const getUniqueFishNames = async (req, res) => {
    try {
        const fishNames = await Recipes.findAll({
            attributes: [[Recipes.sequelize.fn('DISTINCT', Recipes.sequelize.col('fish_name')), 'fish_name']],
            order: [['fish_name', 'ASC']],
            raw: true
        });

        const names = fishNames.map(item => item.fish_name).filter(name => name);

        res.status(200).json({
            msg: "Daftar nama ikan berhasil diambil",
            data: names
        });

    } catch (error) {
        console.error('Error fetching unique fish names:', error);
        res.status(500).json({ msg: "Server error" });
    }
};