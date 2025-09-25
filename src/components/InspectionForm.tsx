import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InspectionItem } from "./InspectionItem";
import { useToast } from "@/hooks/use-toast";

const inspectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  floor: z.string().min(1, "Floor is required"),
  mensRestroom: z.record(z.object({
    status: z.enum(["ok", "clean", "not_clean", "damaged", "not_working", "replenish", "other"]),
    photo: z.any().optional(),
    comments: z.string().optional(),
  })),
  womensRestroom: z.record(z.object({
    status: z.enum(["ok", "clean", "not_clean", "damaged", "not_working", "replenish", "other"]),
    photo: z.any().optional(),
    comments: z.string().optional(),
  })),
  unisexRestroom1: z.record(z.object({
    status: z.enum(["ok", "clean", "not_clean", "damaged", "not_working", "replenish", "other"]),
    photo: z.any().optional(),
    comments: z.string().optional(),
  })),
  unisexRestroom2: z.record(z.object({
    status: z.enum(["ok", "clean", "not_clean", "damaged", "not_working", "replenish", "other"]),
    photo: z.any().optional(),
    comments: z.string().optional(),
  })),
  generalComments: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

const inspectionItems = [
  "walls_ceilings",
  "doors",
  "mirrors_counters", 
  "soap_dispensers",
  "light_fittings",
  "paper_products",
  "toilets_urinals",
  "trash_sharps_containers",
  "floor"
];

const itemLabels: Record<string, string> = {
  walls_ceilings: "Walls and Ceilings",
  doors: "Doors",
  mirrors_counters: "Mirrors & Counters",
  soap_dispensers: "Soap Dispensers",
  light_fittings: "Light Fittings",
  paper_products: "Paper Products",
  toilets_urinals: "Toilets/Urinals",
  trash_sharps_containers: "Trash/Sharps Containers",
  floor: "Floor"
};

export const InspectionForm = () => {
  const { toast } = useToast();
  
  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      floor: "",
      mensRestroom: {},
      womensRestroom: {},
      unisexRestroom1: {},
      unisexRestroom2: {},
      generalComments: "",
    },
  });

  const onSubmit = (data: InspectionFormData) => {
    console.log("Inspection form data:", data);
    toast({
      title: "Inspection Completed",
      description: "Your inspection has been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="mx-auto max-w-2xl">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              USF Daily Restroom Inspection
            </CardTitle>
          </CardHeader>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inspection Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Inspector name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Floor</FormLabel>
                      <FormControl>
                        <Input placeholder="Floor number or name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Men's Restroom */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">Men's Restroom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionItems.map((item) => (
                  <InspectionItem
                    key={`mens-${item}`}
                    label={itemLabels[item]}
                    name={`mensRestroom.${item}`}
                    control={form.control}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Women's Restroom */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">Women's Restroom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionItems.map((item) => (
                  <InspectionItem
                    key={`womens-${item}`}
                    label={itemLabels[item]}
                    name={`womensRestroom.${item}`}
                    control={form.control}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Unisex Restroom 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">Unisex Restroom 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionItems.map((item) => (
                  <InspectionItem
                    key={`unisex1-${item}`}
                    label={itemLabels[item]}
                    name={`unisexRestroom1.${item}`}
                    control={form.control}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Unisex Restroom 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">Unisex Restroom 2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionItems.map((item) => (
                  <InspectionItem
                    key={`unisex2-${item}`}
                    label={itemLabels[item]}
                    name={`unisexRestroom2.${item}`}
                    control={form.control}
                  />
                ))}
              </CardContent>
            </Card>

            {/* General Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">General Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="generalComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional observations or comments..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  Complete Inspection
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};