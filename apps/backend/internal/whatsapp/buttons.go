package whatsapp

type ButtonOption struct {
	ID    string
	Title string
}

type ListRow struct {
	ID          string
	Title       string
	Description string
}

func (c *Client) SendButtons(to, bodyText string, buttons []ButtonOption) error {
	btnList := make([]map[string]interface{}, 0, len(buttons))
	for _, b := range buttons {
		btnList = append(btnList, map[string]interface{}{
			"type": "reply",
			"reply": map[string]string{
				"id":    b.ID,
				"title": b.Title,
			},
		})
	}

	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              "interactive",
		"interactive": map[string]interface{}{
			"type": "button",
			"body": map[string]string{"text": bodyText},
			"action": map[string]interface{}{
				"buttons": btnList,
			},
		},
	}
	return c.send(payload)
}

func (c *Client) SendList(to, bodyText, buttonLabel, sectionTitle string, rows []ListRow) error {
	rowList := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		rowList = append(rowList, map[string]interface{}{
			"id":          r.ID,
			"title":       r.Title,
			"description": r.Description,
		})
	}

	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              "interactive",
		"interactive": map[string]interface{}{
			"type": "list",
			"body": map[string]string{"text": bodyText},
			"action": map[string]interface{}{
				"button": buttonLabel,
				"sections": []map[string]interface{}{
					{
						"title": sectionTitle,
						"rows":  rowList,
					},
				},
			},
		},
	}
	return c.send(payload)
}
