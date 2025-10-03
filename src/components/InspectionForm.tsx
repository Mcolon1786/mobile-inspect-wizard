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
import { generateInspectionPDF } from "@/utils/pdfGenerator";
import { generateInspectionExcel } from "@/utils/excelGenerator";
import { Download, FileSpreadsheet } from "lucide-react";
import usfLogo from "@/assets/usf-logo.png";

// Define all 35 restroom sections
const restroomSections = [
  { key: "basementMensPSTV", label: "Basement Men's Restroom - PSTV" },
  { key: "basementWomensPSTV", label: "Basement Women's Restroom - PSTV" },
  { key: "basementMensPrintShop", label: "Basement Men's Restroom - Print Shop" },
  { key: "basementWomensPrintShop", label: "Basement Women's Restroom - Print Shop" },
  { key: "groundFloorUnisexPayroll1", label: "Ground Floor Unisex Restroom - Payroll" },
  { key: "groundFloorUnisexPayroll2", label: "Ground Floor Unisex Restroom - Payroll" },
  { key: "groundFloorUnisexWarehouse1", label: "Ground Floor Unisex Restroom - Warehouse" },
  { key: "groundFloorUnisexWarehouse2", label: "Ground Floor Unisex Restroom - Warehouse" },
  { key: "floor1MensPortalA", label: "1st Floor Men's Restroom - Portal A" },
  { key: "floor1WomensPortalA", label: "1st Floor Women's Restroom - Portal A" },
  { key: "floor1MensPortalC", label: "1st Floor Men's Restroom - Portal C" },
  { key: "floor1WomensPortalC", label: "1st Floor Women's Restroom - Portal C" },
  { key: "floor1UnisexPortalB_BOE1", label: "1st Floor Unisex Restroom - Portal B - BOE Suite" },
  { key: "floor1UnisexPortalB_BOE2", label: "1st Floor Unisex Restroom - Portal B - BOE Suite" },
  { key: "floor1MensPortalD", label: "1st Floor Men's Restroom - Portal D" },
  { key: "floor1WomensPortalD", label: "1st Floor Women's Restroom - Portal D" },
  { key: "floor2MensPortalA", label: "2nd Floor Men's Restroom - Portal A" },
  { key: "floor2WomensPortalA", label: "2nd Floor Women's Restroom - Portal A" },
  { key: "floor2MensPortalC", label: "2nd Floor Men's Restroom - Portal C" },
  { key: "floor2WomensPortalC", label: "2nd Floor Women's Restroom - Portal C" },
  { key: "floor2UnisexPortalC_Elevator", label: "2nd Floor Unisex Restroom - Portal C - Near Two-Bank Elevator" },
  { key: "floor2MensPortalD", label: "2nd Floor Men's Restroom - Portal D" },
  { key: "floor2WomensPortalD", label: "2nd Floor Women's Restroom - Portal D" },
  { key: "floor3MensPortalA", label: "3rd Floor Men's Restroom - Portal A" },
  { key: "floor3WomensPortalA", label: "3rd Floor Women's Restroom - Portal A" },
  { key: "floor3MensPortalC", label: "3rd Floor Men's Restroom - Portal C" },
  { key: "floor3WomensPortalC", label: "3rd Floor Women's Restroom - Portal C" },
  { key: "floor3UnisexPortalC_OGC", label: "3rd Floor Unisex Restroom - Portal C - OGC Suite" },
  { key: "floor3UnisexPortalB_Super", label: "3rd Floor Unisex Restroom - Portal B - Superintendent Suite" },
  { key: "floor3MensPortalD", label: "3rd Floor Men's Restroom - Portal D" },
  { key: "floor3WomensPortalD", label: "3rd Floor Women's Restroom - Portal D" },
  { key: "floor4MensBreakArea", label: "4th Floor Men's Restroom - Break Area" },
  { key: "floor4WomensBreakArea", label: "4th Floor Women's Restroom - Break Area" },
  { key: "floor4MensNearNOC", label: "4th Floor Men's Restroom - Near N.O.C." },
  { key: "floor4WomensNearNOC", label: "4th Floor Women's Restroom - Near N.O.C." },
];

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

// Build the schema dynamically
const schemaFields: Record<string, any> = {
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  floor: z.string().min(1, "Floor is required"),
  generalComments: z.string().optional(),
};

restroomSections.forEach(section => {
  schemaFields[section.key] = z.record(z.object({
    status: z.enum(["ok", "clean", "not_clean", "damaged", "not_working", "replenish", "other", "na"]).optional(),
    photo: z.any().optional(),
    comments: z.string().optional(),
  }));
});

const inspectionSchema = z.object(schemaFields);
type InspectionFormData = z.infer<typeof inspectionSchema>;

// Build default values dynamically
const buildDefaultValues = () => {
  const defaults: any = {
    name: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    floor: "",
    generalComments: "",
  };
  
  restroomSections.forEach(section => {
    defaults[section.key] = {};
  });
  
  return defaults;
};

export const InspectionForm = () => {
  const { toast } = useToast();
  
  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: buildDefaultValues(),
  });

  const onSubmit = (data: InspectionFormData) => {
    console.log("Inspection form data:", data);
    toast({
      title: "Inspection Completed",
      description: "Your inspection has been saved successfully.",
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const formData = form.getValues();
      await generateInspectionPDF(formData, 'inspection-form');
      toast({
        title: "PDF Generated",
        description: "Your inspection report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = () => {
    try {
      const formData = form.getValues();
      generateInspectionExcel(formData);
      toast({
        title: "Excel Generated",
        description: "Your inspection data has been exported to Excel successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Excel file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="mx-auto max-w-2xl" id="inspection-form">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <img 
                src={usfLogo} 
                alt="USF Facilities Inc. Logo" 
                className="h-16 w-auto object-contain"
              />
              <CardTitle className="text-2xl font-bold text-primary">
                Daily Restroom Inspection
              </CardTitle>
            </div>
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

            {/* All 35 Restroom Sections */}
            {restroomSections.map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{section.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inspectionItems.map((item) => (
                    <InspectionItem
                      key={`${section.key}-${item}`}
                      label={itemLabels[item]}
                      name={`${section.key}.${item}`}
                      control={form.control}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

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
              <CardContent className="pt-6 space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  Complete Inspection
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPDF}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF Report
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDownloadExcel}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  <FileSpreadsheet className="mr-2 h-5 w-5" />
                  Export to Excel
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};
