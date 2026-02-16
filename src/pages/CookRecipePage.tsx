import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Printer, Volume2, VolumeX, UtensilsCrossed } from "lucide-react";

export default function CookRecipePage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["cook_recipe", recipeId],
    enabled: !!recipeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId!)
        .single();
      return data;
    },
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["cook_ingredients", recipeId],
    enabled: !!recipeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("recipe_ingredients")
        .select("*, products(name)")
        .eq("recipe_id", recipeId!)
        .order("created_at");
      return data || [];
    },
  });

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const instructionSteps = useMemo(() => {
    if (!recipe?.instructions) return [];
    return recipe.instructions
      .split("\n")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }, [recipe?.instructions]);

  // TTS
  const startSpeaking = () => {
    if (!supportsTTS || !recipe) return;
    window.speechSynthesis.cancel();

    const parts: string[] = [];
    parts.push(`Opskrift: ${recipe.title}.`);
    if (ingredients.length > 0) {
      parts.push("Ingredienser:");
      ingredients.forEach((ing: any) => {
        const name = ing.products?.name || ing.name || "";
        parts.push(`${ing.quantity} ${ing.unit || "stk"} ${name}.`);
      });
    }
    if (instructionSteps.length > 0) {
      parts.push("Fremgangsmåde:");
      instructionSteps.forEach((step, i) => {
        parts.push(`Trin ${i + 1}: ${step}`);
      });
    }

    const utterance = new SpeechSynthesisUtterance(parts.join(" "));
    utterance.lang = "da-DK";

    // Try to find a Danish voice
    const voices = window.speechSynthesis.getVoices();
    const daVoice = voices.find((v) => v.lang.startsWith("da"));
    if (daVoice) utterance.voice = daVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Indlæser opskrift…</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Opskrift ikke fundet</p>
        <Button variant="outline" onClick={() => navigate("/madplan")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Tilbage til madplan
        </Button>
      </div>
    );
  }

  return (
    <div className="cook-recipe-page max-w-3xl mx-auto space-y-6 pb-8">
      {/* Action bar – hidden in print */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button variant="outline" onClick={() => navigate("/madplan")} className="min-h-[44px] gap-2">
          <ArrowLeft className="h-4 w-4" /> Madplan
        </Button>
        <div className="flex items-center gap-2">
          {supportsTTS && (
            <Button
              variant="outline"
              onClick={isSpeaking ? stopSpeaking : startSpeaking}
              className="min-h-[44px] gap-2"
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isSpeaking ? "Stop" : "Oplæs"}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()} className="min-h-[44px] gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Header */}
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-56 sm:h-72 object-cover rounded-lg"
        />
      )}

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{recipe.title}</h1>
        <div className="flex flex-wrap gap-2">
          {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
          {recipe.prep_time && <Badge variant="outline">🍳 {recipe.prep_time} min</Badge>}
          {recipe.wait_time > 0 && <Badge variant="outline">⏳ {recipe.wait_time} min</Badge>}
        </div>
        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}
      </div>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ingredienser</h2>
          <ul className="space-y-2">
            {ingredients.map((ing: any) => {
              const name = ing.products?.name || ing.name || "Ukendt";
              const checked = checkedIngredients.has(ing.id);
              return (
                <li
                  key={ing.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? "bg-muted line-through text-muted-foreground" : "bg-card"
                  }`}
                  onClick={() => toggleIngredient(ing.id)}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleIngredient(ing.id)}
                    className="h-5 w-5 print:hidden"
                  />
                  <span className="text-base">
                    <strong>{ing.quantity} {ing.unit || "stk"}</strong> {name}
                    {ing.is_staple && <span className="ml-2 text-xs text-muted-foreground">(basis)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Instructions */}
      {instructionSteps.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Fremgangsmåde</h2>
          <ol className="space-y-4">
            {instructionSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <p className="text-base leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
