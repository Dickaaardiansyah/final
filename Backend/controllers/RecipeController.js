import Recipes from "../models/recipeModel.js";

// Ambil semua resep
export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipes.findAll();
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ambil resep berdasarkan nama ikan
export const getRecipeByFish = async (req, res) => {
  try {
    const { fish_name } = req.params;
    const recipe = await Recipes.findOne({ where: { fish_name } });

    if (!recipe) return res.status(404).json({ message: "Resep tidak ditemukan" });

    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tambah resep baru
export const createRecipe = async (req, res) => {
  try {
    const { fish_name, title, image_url, ingredients, instructions } = req.body;
    const newRecipe = await Recipes.create({
      fish_name,
      title,
      image_url,
      ingredients,
      instructions
    });
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update resep
export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipes.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Resep tidak ditemukan" });

    await recipe.update(req.body);
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hapus resep
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipes.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Resep tidak ditemukan" });

    await recipe.destroy();
    res.status(200).json({ message: "Resep berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
