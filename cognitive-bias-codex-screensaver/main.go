package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
)

// Define structs to represent the JSON structure
type Item struct {
	Name     string  `json:"name"`
	Children []Child `json:"children"`
}

type Child struct {
	Name     string       `json:"name"`
	Children []Grandchild `json:"children"`
}

type Grandchild struct {
	Name    string `json:"name"`
	Article string `json:"article"`
}

type FlatItem struct {
	Category    string `json:"category"`
	Subcategory string `json:"subcategory"`
	Name        string `json:"name"`
	Article     string `json:"article"`
	Summary     string `json:"summary"`
}

func main() {
	// Read JSON data from file
	jsonFile, err := ioutil.ReadFile("data.json")
	if err != nil {
		log.Fatalf("Error reading JSON file: %v", err)
	}

	// Unmarshal JSON into slice of Item structs
	var items []Item
	if err := json.Unmarshal(jsonFile, &items); err != nil {
		log.Fatalf("Error unmarshalling JSON: %v", err)
	}

	// Create a slice to hold flattened data
	var flatItems []FlatItem

	// Iterate through items and flatten the structure
	for _, item := range items {
		category := item.Name
		for _, child := range item.Children {
			subcategory := child.Name
			for _, grandchild := range child.Children {
				// Fetch Wikipedia summary
				summary, err := getWikipediaSummary(grandchild.Article)
				if err != nil {
					log.Printf("Error fetching Wikipedia summary for %s: %v", grandchild.Article, err)
					continue // Skip to next item on error
				}

				flatItem := FlatItem{
					Category:    category,
					Subcategory: subcategory,
					Name:        grandchild.Name,
					Article:     grandchild.Article,
					Summary:     summary,
				}
				flatItems = append(flatItems, flatItem)
			}
		}
	}

	// Marshal flatItems slice into JSON format
	flatJSON, err := json.MarshalIndent(flatItems, "", "    ")
	if err != nil {
		log.Fatalf("Error marshalling flat items to JSON: %v", err)
	}

	// Write JSON data to file
	if err := ioutil.WriteFile("data-flat.json", flatJSON, 0644); err != nil {
		log.Fatalf("Error writing JSON to file: %v", err)
	}

	fmt.Println("Successfully wrote flattened data to data-flat.json")
}

func getWikipediaSummary(articleTitle string) (string, error) {
	// Construct Wikipedia API URL
	apiUrl := fmt.Sprintf("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&titles=%s", url.QueryEscape(articleTitle))

	// Make HTTP GET request to Wikipedia API
	resp, err := http.Get(apiUrl)
	if err != nil {
		return "", fmt.Errorf("failed to fetch data from Wikipedia API: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	// Unmarshal JSON response
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to unmarshal JSON response: %v", err)
	}

	// Extract page details
	pages, ok := result["query"].(map[string]interface{})["pages"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("failed to extract 'pages' from JSON response")
	}

	// Find the first page (there should only be one)
	var summary string
	for _, v := range pages {
		page := v.(map[string]interface{})
		extract, ok := page["extract"].(string)
		if !ok {
			return "", fmt.Errorf("failed to extract 'extract' from page")
		}
		summary = extract
		break
	}

	return summary, nil
}
