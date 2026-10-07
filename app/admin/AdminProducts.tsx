"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string | null;
  image: string | null;
  imageScale: number;
  imageFit: string;
  isVisible: boolean;
};

export default function AdminProducts({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: { id: string; name: string }[];
}) {
  const [products, setProducts] = useState(initialProducts);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "");
  const [image, setImage] = useState("");

  const [imageScale, setImageScale] = useState(100);
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory(categories[0]?.name || "");
    setImage("");
    setImageScale(100);
    setImageFit("cover");
    setEditingId(null);
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category || "Other");
    setImage(product.image || "");
    setImageScale(product.imageScale ?? 100);
    setImageFit(product.imageFit === "contain" ? "contain" : "cover");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Не удалось загрузить изображение");
        return;
      }

      setImage(data.url);
      setMessage("Изображение загружено");
    } catch {
      setMessage("Ошибка загрузки изображения");
    } finally {
      setUploading(false);
    }
  }

  async function saveProduct() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name,
          description,
          price,
          stock,
          category,
          image,
          imageScale,
          imageFit,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Ошибка");
        return;
      }

      if (editingId) {
        setProducts((current) =>
          current.map((product) =>
            product.id === editingId ? data.product : product
          )
        );

        setMessage("Товар изменён");
      } else {
        setProducts((current) => [data.product, ...current]);
        setMessage("Товар создан");
      }

      resetForm();
    } catch {
      setMessage("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Удалить товар? Если по нему уже есть заказы, он будет скрыт из магазина, а история покупок сохранится.")) {
      return;
    }

    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(data.error || "Ошибка удаления");
      return;
    }

    if (data.hidden) {
      setProducts((current) =>
        current.map((product) =>
          product.id === id ? { ...product, isVisible: false } : product
        )
      );
      setMessage(data.message || "Товар скрыт из магазина");
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== id));
    setMessage(data.message || "Товар удалён");
  }

  return (
    <div>
      <div className="mb-10 rounded-2xl border border-white/10 bg-[#101010] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black">
            {editingId ? "Редактировать товар" : "Создать товар"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-white"
            >
              Отмена
            </button>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Название
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Green Box"
              className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50"
            >
              <option value="">Без категории</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-gray-400">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание товара"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Цена ₽
            </label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150"
              className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Количество
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="10"
              className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 outline-none focus:border-green-400/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-gray-400">
              Изображение товара
            </label>

            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#080808] px-6 py-4 font-semibold transition hover:border-green-400/50 hover:bg-white/5">
                {uploading ? "Загрузка..." : "📷 Выбрать изображение"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      uploadImage(file);
                    }

                    e.target.value = "";
                  }}
                />
              </label>

              {image && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080808]">
                  <img
                    src={image}
                    alt="Предпросмотр"
                    className="h-32 w-32 object-cover"
                  />
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, WEBP или GIF. Максимум 5 МБ.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
              <div className="mb-5">
                <h3 className="text-lg font-bold">
                  🖼️ Настройка изображения
                </h3>

                <p className="mt-1 text-sm text-white/50">
                  Настрой, как фотография будет выглядеть прямо в карточке
                  товара.
                </p>
              </div>

              {image && (
                <div className="mb-5 flex h-56 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#151515]">
                  <img
                    src={image}
                    alt="Предпросмотр карточки"
                    className="h-full w-full transition-all duration-200"
                    style={{
                      objectFit: imageFit,
                      transform:
                        "scale(" + String(imageScale / 100) + ")",
                    }}
                  />
                </div>
              )}

              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-semibold">
                    Размер изображения
                  </label>

                  <span className="rounded-lg bg-green-500/10 px-3 py-1 text-sm font-bold text-green-400">
                    {imageScale}%
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={imageScale}
                  onChange={(e) =>
                    setImageScale(Number(e.target.value))
                  }
                  className="w-full accent-green-500"
                />

                <div className="mt-1 flex justify-between text-xs text-white/40">
                  <span>50%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-2 block font-semibold">
                  Как показывать фотографию
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImageFit("cover")}
                    className={
                      imageFit === "cover"
                        ? "rounded-xl border border-green-400 bg-green-400/10 px-4 py-3 text-sm font-semibold text-green-400"
                        : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10"
                    }
                  >
                    Заполнить
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageFit("contain")}
                    className={
                      imageFit === "contain"
                        ? "rounded-xl border border-green-400 bg-green-400/10 px-4 py-3 text-sm font-semibold text-green-400"
                        : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10"
                    }
                  >
                    Вписать
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setImageScale(100);
                  setImageFit("cover");
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
              >
                Сбросить настройки
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={saveProduct}
          disabled={loading || uploading}
          className="mt-6 rounded-xl bg-green-400 px-6 py-3 font-bold text-black hover:bg-green-300 disabled:opacity-50"
        >
          {loading
            ? "Сохраняем..."
            : editingId
              ? "Сохранить изменения"
              : "Создать товар"}
        </button>
      </div>

      <div>
        <h2 className="mb-5 text-2xl font-black">
          Все товары ({products.length})
        </h2>

        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#101010] p-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex gap-4">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">
                      {product.name}
                    </h3>

                    <span className="rounded-lg bg-green-400/10 px-2 py-1 text-xs text-green-400">
                      {product.category}
                    </span>
                    {!product.isVisible && (
                      <span className="rounded-lg bg-red-400/10 px-2 py-1 text-xs text-red-300">Скрыт</span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {product.description}
                  </p>

                  <div className="mt-3 flex gap-5 text-sm">
                    <span>
                      Цена:{" "}
                      <b className="text-white">
                        {product.price} ₽
                      </b>
                    </span>

                    <span>
                      Остаток:{" "}
                      <b className="text-green-400">
                        {product.stock}
                      </b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => editProduct(product)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
                >
                  Изменить
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (product.isVisible) {
                      await deleteProduct(product.id);
                      return;
                    }
                    const response = await fetch("/api/admin/products", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        stock: product.stock,
                        category: product.category || "",
                        image: product.image || "",
                        imageScale: product.imageScale,
                        imageFit: product.imageFit,
                        isVisible: true,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) {
                      setMessage(data.error || "Не удалось вернуть товар");
                      return;
                    }
                    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isVisible: true } : item));
                    setMessage("Товар снова опубликован");
                  }}
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold ${product.isVisible ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "border-green-400/20 text-green-300 hover:bg-green-400/10"}`}
                >
                  {product.isVisible ? "Скрыть" : "Вернуть"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}